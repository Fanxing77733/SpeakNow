package com.es.common.constant;

/**
 * 用户角色枚举
 */
public enum RoleEnum {
    LEARNER("学习者"),
    TEACHER("教师"),
    OPERATOR("运营人员"),
    ADMIN("系统管理员");

    private final String label;

    RoleEnum(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
