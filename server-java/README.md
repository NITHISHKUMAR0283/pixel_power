# Pixel Power - Java JDBC Prototype Backend

This folder contains a minimal Spring Boot application that demonstrates using JDBC (JdbcTemplate) with an in-memory H2 database to store SOS messages and sensor data for prototyping.

How to run

1. Ensure JDK 17 and Maven are installed.
2. From this folder run:

```bash
mvn spring-boot:run
```

The server will start on port 8081. Endpoints:
- POST /api/sos  - body: { "message": "help", "lat": 12.34, "lng": 56.78 }
- POST /api/sensor - body: arbitrary JSON of sensor key-values
- GET /api/sos - list recent SOS messages

H2 Console is available at http://localhost:8081/h2-console (JDBC URL: jdbc:h2:mem:pixel)
