package com.project.AIH;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AihApplication {

	public static void main(String[] args) {
		SpringApplication.run(AihApplication.class, args);
	}

}
