package com.project.AIH.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String CV_PARSING_QUEUE = "cv.parsing.queue";
    public static final String CV_PARSING_EXCHANGE = "cv.parsing.exchange";
    public static final String CV_PARSING_ROUTING_KEY = "cv.parsing.routing.key";

    public static final String CV_SCORING_QUEUE = "cv.scoring.queue";
    public static final String CV_SCORING_EXCHANGE = "cv.scoring.exchange";
    public static final String CV_SCORING_ROUTING_KEY = "cv.scoring.routing.key";

    public static final String INTERVIEW_SCORING_QUEUE = "interview.scoring.queue";
    public static final String INTERVIEW_SCORING_EXCHANGE = "interview.scoring.exchange";
    public static final String INTERVIEW_SCORING_ROUTING_KEY = "interview.scoring.routing.key";

    public static final String REPORT_GENERATION_QUEUE = "interview.report.generation.queue";
    public static final String REPORT_GENERATION_EXCHANGE = "interview.report.generation.exchange";
    public static final String REPORT_GENERATION_ROUTING_KEY = "interview.report.generation.routing.key";

    public static final String CV_DLQ = "cv.dlq";
    public static final String CV_DLX = "cv.dlx";
    public static final String CV_DLQ_ROUTING_KEY = "cv.dlq.routing.key";

    @Bean
    public Queue cvParsingQueue() {
        return QueueBuilder.durable(CV_PARSING_QUEUE)
                .withArgument("x-dead-letter-exchange", CV_DLX)
                .withArgument("x-dead-letter-routing-key", CV_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public DirectExchange cvParsingExchange() {
        return new DirectExchange(CV_PARSING_EXCHANGE);
    }

    @Bean
    public Binding cvParsingBinding(Queue cvParsingQueue, DirectExchange cvParsingExchange) {
        return BindingBuilder.bind(cvParsingQueue).to(cvParsingExchange).with(CV_PARSING_ROUTING_KEY);
    }

    @Bean
    public Queue cvScoringQueue() {
        return QueueBuilder.durable(CV_SCORING_QUEUE)
                .withArgument("x-dead-letter-exchange", CV_DLX)
                .withArgument("x-dead-letter-routing-key", CV_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public DirectExchange cvScoringExchange() {
        return new DirectExchange(CV_SCORING_EXCHANGE);
    }

    @Bean
    public Binding cvScoringBinding(Queue cvScoringQueue, DirectExchange cvScoringExchange) {
        return BindingBuilder.bind(cvScoringQueue).to(cvScoringExchange).with(CV_SCORING_ROUTING_KEY);
    }

    @Bean
    public Queue interviewScoringQueue() {
        return QueueBuilder.durable(INTERVIEW_SCORING_QUEUE)
                .withArgument("x-dead-letter-exchange", CV_DLX)
                .withArgument("x-dead-letter-routing-key", CV_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public DirectExchange interviewScoringExchange() {
        return new DirectExchange(INTERVIEW_SCORING_EXCHANGE);
    }

    @Bean
    public Binding interviewScoringBinding(Queue interviewScoringQueue, DirectExchange interviewScoringExchange) {
        return BindingBuilder.bind(interviewScoringQueue).to(interviewScoringExchange).with(INTERVIEW_SCORING_ROUTING_KEY);
    }

    @Bean
    public Queue reportGenerationQueue() {
        return QueueBuilder.durable(REPORT_GENERATION_QUEUE)
                .withArgument("x-dead-letter-exchange", CV_DLX)
                .withArgument("x-dead-letter-routing-key", CV_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public DirectExchange reportGenerationExchange() {
        return new DirectExchange(REPORT_GENERATION_EXCHANGE);
    }

    @Bean
    public Binding reportGenerationBinding(Queue reportGenerationQueue, DirectExchange reportGenerationExchange) {
        return BindingBuilder.bind(reportGenerationQueue).to(reportGenerationExchange).with(REPORT_GENERATION_ROUTING_KEY);
    }

    // Dead Letter Queue and Exchange
    @Bean
    public Queue cvDLQ() {
        return new Queue(CV_DLQ, true);
    }

    @Bean
    public DirectExchange cvDLX() {
        return new DirectExchange(CV_DLX);
    }

    @Bean
    public Binding cvDLQBinding(Queue cvDLQ, DirectExchange cvDLX) {
        return BindingBuilder.bind(cvDLQ).to(cvDLX).with(CV_DLQ_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
