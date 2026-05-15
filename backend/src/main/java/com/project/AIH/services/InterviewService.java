package com.project.AIH.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.AIH.dto.InterviewSubmitAnswerResponseDTO;
import com.project.AIH.dto.InterviewScoringMessage;
import com.project.AIH.dto.ReportGenerationMessage;
import com.project.AIH.models.*;
import com.project.AIH.repositories.*;
import com.project.AIH.utils.constant.InterviewDecisionEnum;
import com.project.AIH.utils.constant.InterviewSessionStatusEnum;
import com.project.AIH.utils.constant.DifficultyLevelEnum;
import com.project.AIH.utils.constant.InterviewTypeEnum;
import com.project.AIH.utils.constant.QuestionTypeEnum;
import com.project.AIH.utils.constant.CriteriaEnum;
import com.project.AIH.utils.constant.InterviewSessionTypeEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.project.AIH.dto.ResultPaginationDTO;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import com.project.AIH.utils.constant.InsightTypeEnum;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final InterviewAnswerRepository answerRepository;
    private final InterviewEvaluationRepository evaluationRepository;
    private final InterviewReportRepository reportRepository;
    private final ApplicationRepository applicationRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;
    
    // Injected Hybrid Repositories
    private final InterviewQuestionBankRepository questionBankRepository;
    private final AnswerScoreRepository answerScoreRepository;
    private final InterviewTemplateRepository templateRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeScanRepository resumeScanRepository;
    private final JobRepository jobRepository;
    private final InterviewScoringPublisher scoringPublisher;
    private final ReportGenerationPublisher reportGenerationPublisher;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixSchema() {
        try {
            log.info("Attempting to fix interview_sessions schema: allowing NULL application_id...");
            jdbcTemplate.execute("ALTER TABLE interview_sessions MODIFY application_id BIGINT NULL");
            jdbcTemplate.execute("ALTER TABLE interview_sessions MODIFY status VARCHAR(32) NOT NULL");
            log.info("Successfully fixed interview_sessions schema.");
        } catch (Exception e) {
            log.warn("Schema fix (ALTER TABLE) skipped or failed: {}. This is normal if the column is already NULL or if permissions are restricted.", e.getMessage());
        }
    }

    private DifficultyLevelEnum mapLevelToDifficulty(String level) {
        if (level == null) {
            return DifficultyLevelEnum.MEDIUM;
        }
        String l = level.toUpperCase();
        if (l.contains("INTERN") || l.contains("FRESHER") || l.contains("EASY")) {
            return DifficultyLevelEnum.EASY;
        } else if (l.contains("JUNIOR") || l.contains("MIDDLE") || l.contains("MEDIUM") || l.contains("MID")) {
            return DifficultyLevelEnum.MEDIUM;
        } else {
            return DifficultyLevelEnum.HARD;
        }
    }

    private int clampMaxQuestions(Integer requestedMaxQuestions) {
        int configured = requestedMaxQuestions == null ? 5 : requestedMaxQuestions;
        if (configured < 1) {
            return 1;
        }
        return Math.min(configured, 10);
    }

    private Map<DifficultyLevelEnum, Integer> resolveDifficultyQuestionCounts(int totalQuestions, Map<String, Integer> difficultyRule, DifficultyLevelEnum fallbackDifficulty) {
        Map<DifficultyLevelEnum, Integer> result = new HashMap<>();
        result.put(DifficultyLevelEnum.EASY, 0);
        result.put(DifficultyLevelEnum.MEDIUM, 0);
        result.put(DifficultyLevelEnum.HARD, 0);

        double easyWeight = 0.5d;
        double mediumWeight = 0.3d;
        double hardWeight = 0.2d;

        if (difficultyRule != null) {
            int easyRaw = Math.max(0, difficultyRule.getOrDefault("easy", 0));
            int mediumRaw = Math.max(0, difficultyRule.getOrDefault("medium", 0));
            int hardRaw = Math.max(0, difficultyRule.getOrDefault("hard", 0));
            int sum = easyRaw + mediumRaw + hardRaw;
            if (sum > 0) {
                easyWeight = (double) easyRaw / sum;
                mediumWeight = (double) mediumRaw / sum;
                hardWeight = (double) hardRaw / sum;
            }
        }

        int easyCount = (int) Math.floor(totalQuestions * easyWeight);
        int mediumCount = (int) Math.floor(totalQuestions * mediumWeight);
        int hardCount = (int) Math.floor(totalQuestions * hardWeight);
        int assigned = easyCount + mediumCount + hardCount;
        int remaining = totalQuestions - assigned;

        result.put(DifficultyLevelEnum.EASY, easyCount);
        result.put(DifficultyLevelEnum.MEDIUM, mediumCount);
        result.put(DifficultyLevelEnum.HARD, hardCount);

        List<DifficultyLevelEnum> fillOrder = List.of(
                DifficultyLevelEnum.MEDIUM,
                DifficultyLevelEnum.HARD,
                DifficultyLevelEnum.EASY
        );
        int idx = 0;
        while (remaining > 0) {
            DifficultyLevelEnum d = fillOrder.get(idx % fillOrder.size());
            result.put(d, result.get(d) + 1);
            idx++;
            remaining--;
        }

        if (totalQuestions > 0 && result.get(DifficultyLevelEnum.EASY) == 0
                && result.get(DifficultyLevelEnum.MEDIUM) == 0
                && result.get(DifficultyLevelEnum.HARD) == 0) {
            result.put(fallbackDifficulty, 1);
        }

        return result;
    }

    private String buildContextualFallbackQuestion(String targetRole, String jobDescription,
                                                   String candidateCvText, DifficultyLevelEnum difficulty,
                                                   int questionOrder) {
        String role = (targetRole == null || targetRole.isBlank()) ? "vị trí ứng tuyển" : targetRole.trim();
        String jdContext = compactContext(jobDescription, 180);
        String cvContext = compactContext(candidateCvText, 180);
        String levelHint = switch (difficulty) {
            case EASY -> "ở mức nền tảng, phù hợp Intern/Fresher";
            case MEDIUM -> "ở mức triển khai thực tế, phù hợp Junior/Middle";
            case HARD, ADAPTIVE -> "ở mức thiết kế, tối ưu và đánh đổi kỹ thuật";
        };

        return switch (questionOrder) {
            case 1 -> "Dựa trên JD của vị trí " + role + ", hãy chọn một yêu cầu kỹ thuật quan trọng và giải thích cách bạn sẽ tiếp cận " + levelHint + ".";
            case 2 -> "Trong CV của bạn có liên quan đến: \"" + cvContext + "\". Hãy mô tả phần bạn trực tiếp triển khai, quyết định kỹ thuật chính và kết quả đạt được.";
            case 3 -> "Với bối cảnh JD: \"" + jdContext + "\", nếu gặp một lỗi hoặc rủi ro kỹ thuật trong quá trình triển khai, bạn sẽ debug và cô lập nguyên nhân như thế nào?";
            case 4 -> "Hãy phân tích một lựa chọn kỹ thuật bạn sẽ cân nhắc cho vị trí " + role + ": vì sao chọn cách đó, trade-off là gì và khi nào cần đổi hướng?";
            default -> "Nếu được cải thiện một phần kỹ thuật trong project hoặc CV hiện tại để phù hợp hơn với vị trí " + role + ", bạn sẽ ưu tiên phần nào và đo kết quả ra sao?";
        };
    }

    private String compactContext(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "chưa có ngữ cảnh cụ thể";
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength) + "...";
    }

    private void publishReportIfReady(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || (session.getStatus() != InterviewSessionStatusEnum.IN_PROGRESS && session.getStatus() != InterviewSessionStatusEnum.REPORT_GENERATING)) {
            return;
        }

        long answeredCount = answerRepository.countTotalAnswersNative(sessionId);
        int requiredAnswers = session.getMaxQuestions() == null ? 5 : session.getMaxQuestions();
        if (answeredCount < requiredAnswers) {
            log.info("Session {} is not ready for report yet: answered={}/{}", sessionId, answeredCount, requiredAnswers);
            return;
        }

        if (reportRepository.findByInterviewSessionId(sessionId).isPresent()) {
            return;
        }

        reportGenerationPublisher.publishReportJob(ReportGenerationMessage.builder()
                .sessionId(sessionId)
                .build());
    }

    @Transactional(readOnly = true)
    public InterviewSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO getSessionsByUser(Specification<InterviewSession> spec, Pageable pageable, User user) {
        log.info("Fetching paginated interview sessions for user ID: {}", user.getId());

        // Secure boundary: Force filtering by current user (join through application and resume)
        Specification<InterviewSession> combinedSpec = (root, query, cb) -> {
            jakarta.persistence.criteria.Join<Object, Object> appJoin = root.join("application", jakarta.persistence.criteria.JoinType.LEFT);
            jakarta.persistence.criteria.Join<Object, Object> appResumeJoin = appJoin.join("resume", jakarta.persistence.criteria.JoinType.LEFT);
            jakarta.persistence.criteria.Join<Object, Object> appUserJoin = appResumeJoin.join("user", jakarta.persistence.criteria.JoinType.LEFT);
            
            jakarta.persistence.criteria.Join<Object, Object> mockResumeJoin = root.join("mockResume", jakarta.persistence.criteria.JoinType.LEFT);
            jakarta.persistence.criteria.Join<Object, Object> mockUserJoin = mockResumeJoin.join("user", jakarta.persistence.criteria.JoinType.LEFT);

            jakarta.persistence.criteria.Predicate appCondition = cb.equal(appUserJoin.get("id"), user.getId());
            jakarta.persistence.criteria.Predicate mockCondition = cb.equal(mockUserJoin.get("id"), user.getId());
            jakarta.persistence.criteria.Predicate createdByCondition = cb.equal(root.get("createdBy"), user.getEmail());
            
            return cb.or(appCondition, mockCondition, createdByCondition);
        };
        if (spec != null) {
            combinedSpec = combinedSpec.and(spec);
        }

        Page<InterviewSession> pageSession = sessionRepository.findAll(combinedSpec, pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageSession.getNumber() + 1);
        meta.setPageSize(pageSession.getSize());
        meta.setPages(pageSession.getTotalPages());
        meta.setTotal(pageSession.getTotalElements());
        rs.setMeta(meta);
        rs.setResult(pageSession.getContent());

        return rs;
    }

    @Transactional(readOnly = true)
    public java.util.Optional<InterviewReport> getReportBySessionId(Long sessionId) {
        return reportRepository.findByInterviewSessionId(sessionId);
    }

    @Transactional
    public InterviewSession startMockSession(Long resumeId, String targetRole, String jobDescription, String targetLevel, Integer maxQuestions, Map<String, Integer> difficultyRule) {
        return startMockSession(resumeId, targetRole, jobDescription, targetLevel, maxQuestions, difficultyRule, null);
    }

    @Transactional
    public InterviewSession startMockSession(Long resumeId, String targetRole, String jobDescription, String targetLevel, Integer maxQuestions, Map<String, Integer> difficultyRule, List<String> skillKeywords) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        return startMockSessionWithResume(resume, targetRole, jobDescription, targetLevel, null, maxQuestions, difficultyRule, skillKeywords);
    }

    @Transactional
    public InterviewSession startMockSessionByScan(Long scanId, String targetRole, String jobDescription, String targetLevel, Integer maxQuestions, Map<String, Integer> difficultyRule) {
        return startMockSessionByScan(scanId, targetRole, jobDescription, targetLevel, maxQuestions, difficultyRule, null);
    }

    @Transactional
    public InterviewSession startMockSessionByScan(Long scanId, String targetRole, String jobDescription, String targetLevel, Integer maxQuestions, Map<String, Integer> difficultyRule, List<String> skillKeywords) {
        ResumeScan scan = resumeScanRepository.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Resume scan not found"));
        Resume syntheticResume = Resume.builder()
                .extractedText(scan.getExtractedText())
                .fullName(scan.getCandidateName())
                .predictedIndustry(scan.getIndustry())
                .build();
        return startMockSessionWithResume(syntheticResume, targetRole, jobDescription, targetLevel, scanId, maxQuestions, difficultyRule, skillKeywords);
    }

    private InterviewSession startMockSessionWithResume(Resume resume, String targetRole, String jobDescription, String targetLevel, Long sourceResumeScanId, Integer requestedMaxQuestions, Map<String, Integer> difficultyRule, List<String> skillKeywords) {
        DifficultyLevelEnum difficulty = mapLevelToDifficulty(targetLevel);
        int maxQuestions = clampMaxQuestions(requestedMaxQuestions);
        
        InterviewSession session = InterviewSession.builder()
                .sessionType(InterviewSessionTypeEnum.MOCK)
                .mockResume(resume.getId() != null ? resume : null)
                .sourceResumeScanId(sourceResumeScanId)
                .mockJobTitle(targetRole)
                .mockJdContent(jobDescription)
                .status(InterviewSessionStatusEnum.IN_PROGRESS)
                .interviewType(InterviewTypeEnum.MIXED)
                .difficultyLevel(difficulty)
                .totalQuestions(1)
                .maxQuestions(maxQuestions)
                .build();
        session = sessionRepository.save(session);

        String industry = (resume.getBasicInfo() != null) ? resume.getBasicInfo().getPredictedIndustry() : "IT";
        if (industry == null || industry.isEmpty()) {
            industry = "IT";
        }

        setupQuestionsForSession(session, targetRole, jobDescription, resume, difficulty, null, industry, difficultyRule, skillKeywords);
        
        return session;
    }

    @Transactional
    public InterviewSession startSession(Long applicationId) {
        return startSession(applicationId, null, null, null);
    }

    @Transactional
    public InterviewSession startSession(Long applicationId, String targetLevel) {
        return startSession(applicationId, targetLevel, null, null);
    }

    @Transactional
    public InterviewSession startSession(Long applicationId, String targetLevel, Integer requestedMaxQuestions) {
        return startSession(applicationId, targetLevel, requestedMaxQuestions, null);
    }

    @Transactional
    public InterviewSession startSession(Long applicationId, String targetLevel, Integer requestedMaxQuestions, Map<String, Integer> difficultyRule) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Determine level of candidates: Target parameter, or fallback to predicted level in CV
        DifficultyLevelEnum difficulty = DifficultyLevelEnum.MEDIUM;
        if (targetLevel != null && !targetLevel.isEmpty()) {
            difficulty = mapLevelToDifficulty(targetLevel);
        } else if (application.getResume().getBasicInfo() != null && application.getResume().getBasicInfo().getPredictedLevel() != null) {
            difficulty = mapLevelToDifficulty(application.getResume().getBasicInfo().getPredictedLevel().name());
        }

        int maxQuestions = clampMaxQuestions(requestedMaxQuestions);

        InterviewSession session = InterviewSession.builder()
                .application(application)
                .status(InterviewSessionStatusEnum.IN_PROGRESS)
                .interviewType(InterviewTypeEnum.MIXED)
                .difficultyLevel(difficulty)
                .totalQuestions(1)
                .maxQuestions(maxQuestions)
                .build();
        session = sessionRepository.save(session);

        Job job = application.getJob();
        Resume resume = application.getResume();
        String targetRole = job.getTitle();
        String industry = (resume.getBasicInfo() != null) ? resume.getBasicInfo().getPredictedIndustry() : "IT";
        if (industry == null || industry.isEmpty()) {
            industry = "IT";
        }

        List<String> skillKeywords = job.getSkills() == null ? null : job.getSkills().stream()
                .map(Skill::getName)
                .filter(s -> s != null && !s.isBlank())
                .toList();
        setupQuestionsForSession(session, targetRole, job.getDescription(), resume, difficulty, job.getId(), industry, difficultyRule, skillKeywords);

        return session;
    }

    private void setupQuestionsForSession(InterviewSession session, String targetRole, String jobDescription, 
                                        Resume resume, DifficultyLevelEnum defaultDifficulty, Long jobId, String industry,
                                        Map<String, Integer> difficultyRule, List<String> skillKeywords) {
        List<InterviewQuestion> sessionQuestions = new ArrayList<>();
        List<InterviewQuestionBank> banksToUpdate = new ArrayList<>();
        List<InterviewQuestionBank> banksToInsert = new ArrayList<>();
        Job jobForBank = null;
        if (jobId != null) {
            jobForBank = jobRepository.findById(jobId).orElse(null);
        }
        int questionTarget = clampMaxQuestions(session.getMaxQuestions());
        Map<DifficultyLevelEnum, Integer> difficultyCounts = resolveDifficultyQuestionCounts(questionTarget, difficultyRule, defaultDifficulty);

        for (DifficultyLevelEnum difficulty : List.of(DifficultyLevelEnum.EASY, DifficultyLevelEnum.MEDIUM, DifficultyLevelEnum.HARD)) {
            int bucketTarget = difficultyCounts.getOrDefault(difficulty, 0);
            if (bucketTarget <= 0) {
                continue;
            }

            int startSize = sessionQuestions.size();
            List<InterviewQuestionBank> cachedPool = (jobId != null) ?
                    questionBankRepository.findByJobIdAndDifficulty(jobId, difficulty) :
                    new ArrayList<>();

            if (!cachedPool.isEmpty()) {
                List<InterviewQuestionBank> selectedPool = new ArrayList<>(cachedPool);
                java.util.Collections.shuffle(selectedPool);
                int takeFromPool = Math.min(bucketTarget, selectedPool.size());
                for (int i = 0; i < takeFromPool; i++) {
                    InterviewQuestionBank bankQ = selectedPool.get(i);
                    bankQ.setUseCount(bankQ.getUseCount() + 1);
                    banksToUpdate.add(bankQ);
                    sessionQuestions.add(InterviewQuestion.builder()
                            .interviewSession(session)
                            .questionText(bankQ.getQuestionText())
                            .questionType(bankQ.getQuestionType())
                            .difficulty(difficulty)
                            .questionOrder(sessionQuestions.size() + 1)
                            .canReuse(true)
                            .build());
                }
            }

            int bucketMissing = bucketTarget - (sessionQuestions.size() - startSize);
            if (bucketMissing > 0) {
                try {
                    String aiResponse = geminiService.generateAllQuestions(
                            jobDescription, resume.getExtractedText(), targetRole, industry, difficulty.name(), bucketMissing, skillKeywords);
                    JsonNode questionsArray = objectMapper.readTree(aiResponse);
                    if (questionsArray.isArray()) {
                        for (int i = 0; i < questionsArray.size() && bucketMissing > 0; i++) {
                            JsonNode qNode = questionsArray.get(i);
                            boolean canReuse = qNode.path("can_reuse").asBoolean(false);
                            InterviewQuestion q = InterviewQuestion.builder()
                                    .interviewSession(session)
                                    .questionText(qNode.path("question").asText())
                                    .questionType(QuestionTypeEnum.TECHNICAL)
                                    .difficulty(difficulty)
                                    .questionOrder(sessionQuestions.size() + 1)
                                    .cvContext(qNode.path("cv_context").asText())
                                    .jdContext(qNode.path("jd_context").asText())
                                    .canReuse(canReuse)
                                    .build();
                            sessionQuestions.add(q);
                            bucketMissing--;

                            if (jobForBank != null && canReuse) {
                                banksToInsert.add(InterviewQuestionBank.builder()
                                        .job(jobForBank)
                                        .questionText(q.getQuestionText())
                                        .questionType(QuestionTypeEnum.TECHNICAL)
                                        .difficulty(difficulty)
                                        .topic(targetRole)
                                        .questionOrder(q.getQuestionOrder())
                                        .useCount(1)
                                        .build());
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to generate questions for difficulty {}", difficulty, e);
                }
            }
        }

        if (sessionQuestions.isEmpty()) {
            log.info("No question generated from pool/Gemini. Falling back to full generation with {} questions...", questionTarget);
            try {
                String aiResponse = geminiService.generateAllQuestions(
                        jobDescription, resume.getExtractedText(), targetRole, industry, defaultDifficulty.name(), questionTarget, skillKeywords);
                JsonNode questionsArray = objectMapper.readTree(aiResponse);
                if (questionsArray.isArray()) {
                    for (int i = 0; i < questionsArray.size() && sessionQuestions.size() < questionTarget; i++) {
                        JsonNode qNode = questionsArray.get(i);
                        boolean isReusable = qNode.path("can_reuse").asBoolean(false);
                        InterviewQuestion q = InterviewQuestion.builder()
                                .interviewSession(session)
                                .questionText(qNode.path("question").asText())
                                .questionType(QuestionTypeEnum.TECHNICAL)
                                .difficulty(defaultDifficulty)
                                .questionOrder(sessionQuestions.size() + 1)
                                .cvContext(qNode.path("cv_context").asText())
                                .jdContext(qNode.path("jd_context").asText())
                                .canReuse(isReusable)
                                .build();
                        sessionQuestions.add(q);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to generate fallback questions via Gemini", e);
            }
        }

        String candidateCvText = resume != null ? resume.getExtractedText() : null;
        for (int i = sessionQuestions.size(); i < questionTarget; i++) {
            sessionQuestions.add(InterviewQuestion.builder()
                    .interviewSession(session)
                    .questionText(buildContextualFallbackQuestion(targetRole, jobDescription, candidateCvText, defaultDifficulty, i + 1))
                    .questionType(QuestionTypeEnum.TECHNICAL)
                    .difficulty(defaultDifficulty)
                    .questionOrder(i + 1)
                    .canReuse(false)
                    .build());
        }

        if (!banksToUpdate.isEmpty()) {
            questionBankRepository.saveAll(banksToUpdate);
        }
        if (!banksToInsert.isEmpty()) {
            questionBankRepository.saveAll(banksToInsert);
        }
        questionRepository.saveAll(sessionQuestions);
        
        session.setTotalQuestions(questionTarget);
        session.setMaxQuestions(questionTarget);
        sessionRepository.save(session);
    }

    @Transactional
    public InterviewSubmitAnswerResponseDTO submitAnswer(Long sessionId, String answerText, String idempotencyKey) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != InterviewSessionStatusEnum.IN_PROGRESS) {
            throw new RuntimeException("Interview session is already finished");
        }

        // Check if idempotency key is already used
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            java.util.Optional<InterviewAnswer> existingAnswer = answerRepository.findByIdempotencyKey(idempotencyKey);
            if (existingAnswer.isPresent()) {
                InterviewAnswer ans = existingAnswer.get();
                log.info("Duplicate submit detected via idempotency key: {}. Returning cached response.", idempotencyKey);
                
                InterviewQuestion nextQ = null;
                int currentOrder = ans.getInterviewQuestion().getQuestionOrder();
                boolean isFinished = currentOrder >= session.getMaxQuestions();
                
                if (!isFinished) {
                    List<InterviewQuestion> allQuestions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
                    for (InterviewQuestion q : allQuestions) {
                        if (q.getQuestionOrder() == currentOrder + 1) {
                            nextQ = q;
                            break;
                        }
                    }
                }
                
                return InterviewSubmitAnswerResponseDTO.builder()
                        .evaluation(null)
                        .nextQuestion(nextQ)
                        .isFinished(isFinished)
                        .scoreStatus("pending")
                        .build();
            }
        }

        // Find current active question
        List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        if (questions.isEmpty()) {
            throw new RuntimeException("No question found for this session");
        }
        
        // The current question is the first unanswered one
        InterviewQuestion currentQuestion = null;
        for (InterviewQuestion q : questions) {
            if (q.getInterviewAnswer() == null) {
                currentQuestion = q;
                break;
            }
        }
        
        if (currentQuestion == null) {
            throw new RuntimeException("All questions have been answered");
        }

        // Save candidate answer
        InterviewAnswer answer = InterviewAnswer.builder()
                .interviewQuestion(currentQuestion)
                .answerText(answerText)
                .idempotencyKey(idempotencyKey)
                .build();
        
        try {
            answer = answerRepository.saveAndFlush(answer);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Database unique constraint violation on idempotency key: {}. Trying to recover.", idempotencyKey);
            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                java.util.Optional<InterviewAnswer> dup = answerRepository.findByIdempotencyKey(idempotencyKey);
                if (dup.isPresent()) {
                    InterviewAnswer ans = dup.get();
                    InterviewQuestion nextQ = null;
                    int currentOrder = ans.getInterviewQuestion().getQuestionOrder();
                    boolean isFinished = currentOrder >= session.getMaxQuestions();
                    
                    if (!isFinished) {
                        List<InterviewQuestion> allQuestions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
                        for (InterviewQuestion q : allQuestions) {
                            if (q.getQuestionOrder() == currentOrder + 1) {
                                nextQ = q;
                                break;
                            }
                        }
                    }
                    
                    return InterviewSubmitAnswerResponseDTO.builder()
                            .evaluation(null)
                            .nextQuestion(nextQ)
                            .isFinished(isFinished)
                            .scoreStatus("pending")
                            .build();
                }
            }
            throw ex;
        }

        int currentOrder = currentQuestion.getQuestionOrder();
        boolean isFinished = currentOrder >= session.getMaxQuestions();

        String targetRole = session.getJobTitle();
        String industry = "IT";

        if (session.getSessionType() == InterviewSessionTypeEnum.MOCK) {
            if (session.getMockResume() != null && session.getMockResume().getBasicInfo() != null) {
                industry = session.getMockResume().getBasicInfo().getPredictedIndustry();
            }
        } else if (session.getApplication() != null && session.getApplication().getResume() != null) {
            Resume resume = session.getApplication().getResume();
            if (resume.getBasicInfo() != null) {
                industry = resume.getBasicInfo().getPredictedIndustry();
            }
        }

        if (industry == null || industry.isEmpty()) {
            industry = "IT";
        }
        String level = session.getDifficultyLevel().name();

        // Send to RabbitMQ for async scoring
        InterviewScoringMessage scoringMessage = InterviewScoringMessage.builder()
                .answerId(answer.getId())
                .sessionId(sessionId)
                .questionText(currentQuestion.getQuestionText())
                .answerText(answerText)
                .targetRole(targetRole)
                .industry(industry)
                .level(level)
                .build();
        scoringPublisher.publishScoringJob(scoringMessage);

        InterviewQuestion nextQuestion = null;
        if (!isFinished) {
            int nextOrder = currentOrder + 1;
            for (InterviewQuestion q : questions) {
                if (q.getQuestionOrder() == nextOrder) {
                    nextQuestion = q;
                    break;
                }
            }
        }


        return InterviewSubmitAnswerResponseDTO.builder()
                .evaluation(null) // Evaluation is async now
                .nextQuestion(nextQuestion)
                .isFinished(isFinished)
                .scoreStatus("pending")
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getScoreStatuses(Long sessionId) {
        List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        List<Map<String, Object>> scores = questions.stream().map(q -> {
            Map<String, Object> scoreInfo = new HashMap<>();
            scoreInfo.put("questionId", q.getId());
            scoreInfo.put("questionOrder", q.getQuestionOrder());
            
            if (q.getInterviewAnswer() != null && q.getInterviewAnswer().getInterviewEvaluation() != null) {
                scoreInfo.put("status", "completed");
                scoreInfo.put("score", q.getInterviewAnswer().getInterviewEvaluation().getScore());
                scoreInfo.put("feedback", q.getInterviewAnswer().getInterviewEvaluation().getFeedback());
            } else if (q.getInterviewAnswer() != null) {
                scoreInfo.put("status", "pending");
            } else {
                scoreInfo.put("status", "unanswered");
            }
            return scoreInfo;
        }).collect(Collectors.toList());
        
        return Map.of("scores", scores);
    }

    public void saveCriteriaScores(InterviewAnswer answer, JsonNode scoresNode) {
        if (scoresNode != null && scoresNode.isObject()) {
            List<AnswerScore> answerScores = new ArrayList<>();
            for (CriteriaEnum criteria : CriteriaEnum.values()) {
                // Try uppercase first, then fallback to lowercase for robust LLM parsing
                JsonNode cNode = scoresNode.path(criteria.name());
                if (cNode.isMissingNode() || cNode.isNull()) {
                    cNode = scoresNode.path(criteria.name().toLowerCase());
                }

                if (!cNode.isMissingNode() && !cNode.isNull()) {
                    int cScore = cNode.path("score").asInt(5);
                    String cComment = cNode.path("comment").asText("");

                    AnswerScore answerScore = AnswerScore.builder()
                            .interviewAnswer(answer)
                            .criteria(criteria)
                            .score(cScore)
                            .comment(cComment)
                            .build();
                    answerScores.add(answerScore);
                }
            }
            if (!answerScores.isEmpty()) {
                answerScoreRepository.saveAll(answerScores);
            }
        }
    }

    @Transactional
    public InterviewSession finishSession(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus(InterviewSessionStatusEnum.REPORT_GENERATING);
        session = sessionRepository.save(session);
        publishReportIfReady(sessionId);
        log.info("finishSession called for session {}. Status set to REPORT_GENERATING.", sessionId);
        return session;
    }

    @Transactional
    public InterviewSession generateReportSynchronously(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (reportRepository.findByInterviewSessionId(sessionId).isPresent()) {
            log.info("Report for session {} already exists. Skipping generation.", sessionId);
            return session;
        }

        if (session.getStatus() == InterviewSessionStatusEnum.COMPLETED) {
            log.info("Report for session {} is already COMPLETED. Skipping.", sessionId);
            return session;
        }

        try {
            List<InterviewQuestion> questions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
            String chatHistory = getChatHistoryForReport(questions);
            String jobDesc = session.getJobDescription();

            log.info("Calling Gemini for final report generation (Session: {})", sessionId);
            String aiResponse = geminiService.generateFinalReport(jobDesc, chatHistory);

            JsonNode resultNode = objectMapper.readTree(aiResponse);
            double finalScoreDouble = resultNode.path("final_score").asDouble();
            String decisionStr = resultNode.path("decision").asText("CONSIDER");
            String summary = resultNode.path("summary").asText();
            
            InterviewDecisionEnum decision = InterviewDecisionEnum.CONSIDER;
            try {
                decision = InterviewDecisionEnum.valueOf(decisionStr);
            } catch (Exception ex) {
                log.warn("Invalid decision string: {}, default to CONSIDER", decisionStr);
            }

            // Create and save final report
            InterviewReport report = InterviewReport.builder()
                    .interviewSession(session)
                    .finalScore(BigDecimal.valueOf(finalScoreDouble))
                    .decision(decision)
                    .summary(summary)
                    .build();

            List<InterviewInsight> insightsList = new ArrayList<>();

            // Parse strengths
            JsonNode strengthsNode = resultNode.path("strengths");
            if (strengthsNode.isArray()) {
                int index = 0;
                for (JsonNode node : strengthsNode) {
                    insightsList.add(InterviewInsight.builder()
                            .interviewReport(report)
                            .type(InsightTypeEnum.STRENGTH)
                            .title(node.asText())
                            .displayOrder(index++)
                            .build());
                }
            }

            // Parse weaknesses
            JsonNode weaknessesNode = resultNode.path("weaknesses");
            if (weaknessesNode.isArray()) {
                int index = 0;
                for (JsonNode node : weaknessesNode) {
                    insightsList.add(InterviewInsight.builder()
                            .interviewReport(report)
                            .type(InsightTypeEnum.WEAKNESS)
                            .title(node.asText())
                            .displayOrder(index++)
                            .build());
                }
            }

            report.setInsights(insightsList);
            reportRepository.save(report);

            session.setStatus(InterviewSessionStatusEnum.COMPLETED);
            session.setEndTime(Instant.now());
            
            return sessionRepository.save(session);
        } catch (Exception e) {
            log.error("Failed to generate or parse Gemini final report: {}", e.getMessage());
            // Reset status so it can be retried
            session.setStatus(InterviewSessionStatusEnum.IN_PROGRESS);
            sessionRepository.save(session);
            throw new RuntimeException("Error generating final report: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<InterviewQuestion> getSessionQuestions(Long sessionId) {
        log.debug("Fetching questions for interview session ID: {}", sessionId);
        return questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public List<InterviewQuestion> getVisibleQuestions(Long sessionId) {
        log.debug("Fetching visible questions for interview session ID: {}", sessionId);
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        List<InterviewQuestion> allQuestions = questionRepository.findByInterviewSessionIdOrderByQuestionOrderAsc(sessionId);
        
        if (session.getStatus() == InterviewSessionStatusEnum.COMPLETED) {
            return allQuestions;
        }
        
        List<InterviewQuestion> visibleQuestions = new ArrayList<>();
        for (InterviewQuestion q : allQuestions) {
            visibleQuestions.add(q);
            if (q.getInterviewAnswer() == null) {
                break;
            }
        }
        return visibleQuestions;
    }

    private String getChatHistory(List<InterviewQuestion> questions, String latestAnswer) {
        StringBuilder sb = new StringBuilder();
        for (InterviewQuestion q : questions) {
            sb.append("AI: ").append(q.getQuestionText()).append("\n");
            if (q.getInterviewAnswer() != null) {
                sb.append("CANDIDATE: ").append(q.getInterviewAnswer().getAnswerText()).append("\n");
            }
        }
        if (!questions.isEmpty() && questions.get(questions.size() - 1).getInterviewAnswer() == null) {
            sb.append("CANDIDATE: ").append(latestAnswer).append("\n");
        }
        return sb.toString();
    }

    private String getChatHistoryForReport(List<InterviewQuestion> questions) {
        StringBuilder sb = new StringBuilder();
        for (InterviewQuestion q : questions) {
            sb.append("AI: ").append(q.getQuestionText()).append("\n");
            if (q.getInterviewAnswer() != null) {
                sb.append("CANDIDATE: ").append(q.getInterviewAnswer().getAnswerText()).append("\n");
            }
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public long getPendingEvaluationsCount(Long sessionId) {
        return answerRepository.countPendingEvaluationsNative(sessionId);
    }

    @Transactional(readOnly = true)
    public long getAnsweredCount(Long sessionId) {
        return answerRepository.countTotalAnswersNative(sessionId);
    }
}
