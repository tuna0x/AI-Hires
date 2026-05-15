package com.project.AIH.controllers;

import com.project.AIH.models.ScoringRule;
import com.project.AIH.models.Skill;
import com.project.AIH.repositories.ScoringRuleRepository;
import com.project.AIH.repositories.SkillRepository;
import com.project.AIH.utils.annotation.ApiMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ScoringRuleRepository scoringRuleRepository;
    private final SkillRepository skillRepository;

    @GetMapping("/skills")
    @ApiMessage("Fetch all skills")
    public ResponseEntity<List<Skill>> getAllSkills() {
        return ResponseEntity.ok(skillRepository.findAll());
    }

    @PostMapping("/skills")
    @ApiMessage("Create or update skills")
    public ResponseEntity<List<Skill>> updateSkills(@RequestBody List<Skill> skills) {
        return ResponseEntity.ok(skillRepository.saveAll(skills));
    }

    @DeleteMapping("/skills/{id}")
    @ApiMessage("Delete skill")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        skillRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/scoring-rules")
    @ApiMessage("Fetch all scoring rules")
    public ResponseEntity<List<ScoringRule>> getAllScoringRules() {
        return ResponseEntity.ok(scoringRuleRepository.findAll());
    }

    @PostMapping("/scoring-rules")
    @ApiMessage("Update scoring rules")
    public ResponseEntity<List<ScoringRule>> updateScoringRules(@RequestBody List<ScoringRule> rules) {
        return ResponseEntity.ok(scoringRuleRepository.saveAll(rules));
    }
}
