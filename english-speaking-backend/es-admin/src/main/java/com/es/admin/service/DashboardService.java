package com.es.admin.service;

import java.util.Map;

public interface DashboardService {

    Map<String, Object> getOverview();

    Map<String, Object> getUserStats();
}
