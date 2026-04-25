package com.project.AIH.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateUserDTO {
    private Long id;
    private String fullName;
    private String phoneNumber;
    private String avatar;
}
