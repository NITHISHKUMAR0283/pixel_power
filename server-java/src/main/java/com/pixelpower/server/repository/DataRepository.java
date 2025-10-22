package com.pixelpower.server.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

@Repository
public class DataRepository {

    private final JdbcTemplate jdbc;

    public DataRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insertSos(Map<String, Object> payload) {
        String sql = "INSERT INTO sos (message, lat, lng, created_at) VALUES (?, ?, ?, ?)";
        jdbc.update(sql,
                payload.getOrDefault("message", "SOS"),
                payload.getOrDefault("lat", null),
                payload.getOrDefault("lng", null),
                new Timestamp(System.currentTimeMillis())
        );
    }

    public void insertSensor(Map<String, Object> payload) {
        String sql = "INSERT INTO sensor_data (key_name, value, created_at) VALUES (?, ?, ?)";
        payload.forEach((k, v) -> jdbc.update(sql, k, v == null ? null : v.toString(), new Timestamp(System.currentTimeMillis())));
    }

    public List<Map<String, Object>> listSos() {
        return jdbc.queryForList("SELECT id, message, lat, lng, created_at FROM sos ORDER BY created_at DESC");
    }
}
