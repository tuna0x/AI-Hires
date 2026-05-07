package com.project.AIH.dto.user;

import com.project.AIH.utils.constant.GenderEnum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUpdateUserDTO {
    private Long id;
    private String fullName;
    private String phoneNumber;
    private String avatar;
    private String address;
    private Integer age;
    private GenderEnum gender;
}
