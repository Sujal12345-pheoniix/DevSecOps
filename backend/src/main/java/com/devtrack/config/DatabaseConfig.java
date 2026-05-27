package com.devtrack.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import com.zaxxer.hikari.HikariDataSource;

@Configuration
public class DatabaseConfig {

    @Autowired
    private Environment env;

    @Bean
    @Primary
    public HikariDataSource dataSource(DataSourceProperties properties) {
        // 1. Resolve the JDBC URL from SPRING_DATASOURCE_URL, DATABASE_URL, or properties file
        String url = env.getProperty("SPRING_DATASOURCE_URL");
        if (url == null || url.trim().isEmpty()) {
            url = env.getProperty("DATABASE_URL");
        }
        if (url == null || url.trim().isEmpty()) {
            url = properties.getUrl();
        }

        // 2. Prepend 'jdbc:' if the URL is in the raw standard PostgreSQL format (postgresql://...)
        if (url != null && url.startsWith("postgresql://")) {
            url = "jdbc:" + url;
        }

        // 3. Resolve Database Username
        String username = env.getProperty("SPRING_DATASOURCE_USERNAME");
        if (username == null || username.trim().isEmpty()) {
            username = properties.getUsername();
        }

        // 4. Resolve Database Password
        String password = env.getProperty("SPRING_DATASOURCE_PASSWORD");
        if (password == null || password.trim().isEmpty()) {
            password = properties.getPassword();
        }

        // 5. Construct and configure HikariCP DataSource
        return properties.initializeDataSourceBuilder()
                .url(url)
                .username(username)
                .password(password)
                .type(HikariDataSource.class)
                .build();
    }
}
