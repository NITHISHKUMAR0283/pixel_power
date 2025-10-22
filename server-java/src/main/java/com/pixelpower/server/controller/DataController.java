package com.pixelpower.server.controller;

import com.pixelpower.server.repository.DataRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DataController {

    private final DataRepository repo;

    public DataController(DataRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/sos")
    public ResponseEntity<?> postSos(@RequestBody Map<String, Object> payload) {
        repo.insertSos(payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/sensor")
    public ResponseEntity<?> postSensor(@RequestBody Map<String, Object> payload) {
        repo.insertSensor(payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/sos")
    public ResponseEntity<List<Map<String, Object>>> getSos() {
        return ResponseEntity.ok(repo.listSos());
    }
}
