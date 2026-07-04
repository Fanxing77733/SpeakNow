package com.es.learning.service;

import java.util.Map;

public interface PredictionService {
    Map<String, Object> getAlert(Long userId);
    void computePredictions();
}
