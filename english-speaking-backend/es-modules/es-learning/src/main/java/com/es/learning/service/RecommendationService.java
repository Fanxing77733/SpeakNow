package com.es.learning.service;

import java.util.List;
import java.util.Map;

public interface RecommendationService {
    List<Map<String, Object>> recommendSentences(Long userId);
    List<Map<String, String>> recommendScenes(Long userId);
    void computeAndCacheRecommendations();
}
