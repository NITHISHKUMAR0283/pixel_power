package com.pixelpower.server.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Repository
public class DataRepository {

    private final JdbcTemplate jdbc;
    private final Path dumpFile;

    public DataRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.dumpFile = Paths.get("server-java", "data", "data_dump.sql");
        try {
            Path dir = dumpFile.getParent();
            if (dir != null && !Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            if (!Files.exists(dumpFile)) {
                Files.createFile(dumpFile);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize dump file path: " + dumpFile, e);
        }
    }

    public void insertSos(Map<String, Object> payload) {
        String sql = "INSERT INTO sos (message, lat, lng, created_at) VALUES (?, ?, ?, ?)";
        jdbc.update(sql,
                payload.getOrDefault("message", "SOS"),
                payload.getOrDefault("lat", null),
                payload.getOrDefault("lng", null),
                new Timestamp(System.currentTimeMillis())
        );
        // append SQL dump
        String msg = String.valueOf(payload.getOrDefault("message", "SOS")).replace("'", "''");
        Object lat = payload.getOrDefault("lat", null);
        Object lng = payload.getOrDefault("lng", null);
        String latStr = lat == null ? "NULL" : lat.toString();
        String lngStr = lng == null ? "NULL" : lng.toString();
        String ts = new Timestamp(System.currentTimeMillis()).toString();
        String insert = String.format("INSERT INTO sos (message, lat, lng, created_at) VALUES ('%s', %s, %s, '%s');%n",
                msg, latStr, lngStr, ts);
        try {
            Files.write(dumpFile, insert.getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);
        } catch (IOException e) {
            // Log but do not fail the request
            System.err.println("Failed to write sos to dump file: " + e.getMessage());
        }
    }

    public void insertSensor(Map<String, Object> payload) {
        String sql = "INSERT INTO sensor_data (key_name, value, created_at) VALUES (?, ?, ?)";
        payload.forEach((k, v) -> jdbc.update(sql, k, v == null ? null : v.toString(), new Timestamp(System.currentTimeMillis())));
        // append SQL dump for sensor data (one insert per key)
        String ts = new Timestamp(System.currentTimeMillis()).toString();
        StringBuilder sb = new StringBuilder();
        payload.forEach((k, v) -> {
            String key = k.replace("'", "''");
            String val = v == null ? null : v.toString().replace("'", "''");
            String valStr = val == null ? "NULL" : "'" + val + "'";
            sb.append(String.format("INSERT INTO sensor_data (key_name, value, created_at) VALUES ('%s', %s, '%s');%n", key, valStr, ts));
        });
        try {
            Files.write(dumpFile, sb.toString().getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);
        } catch (IOException e) {
            System.err.println("Failed to write sensor data to dump file: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> listSos() {
        return jdbc.queryForList("SELECT id, message, lat, lng, created_at FROM sos ORDER BY created_at DESC");
    }
}
