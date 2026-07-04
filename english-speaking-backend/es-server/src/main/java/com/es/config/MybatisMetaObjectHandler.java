package com.es.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * MyBatis-Plus 字段自动填充处理器
 */
@Slf4j
@Component
public class MybatisMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        autoFill(metaObject, "createdAt", now);
        autoFill(metaObject, "updatedAt", now);
        autoFill(metaObject, "joinedAt", now);
        autoFill(metaObject, "submittedAt", now);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        autoFill(metaObject, "updatedAt", LocalDateTime.now());
        autoFill(metaObject, "reviewedAt", LocalDateTime.now());
    }

    private void autoFill(MetaObject metaObject, String fieldName, Object value) {
        if (metaObject.hasGetter(fieldName)) {
            Object existing = getFieldValByName(fieldName, metaObject);
            if (existing == null) {
                setFieldValByName(fieldName, value, metaObject);
            }
        }
    }
}
