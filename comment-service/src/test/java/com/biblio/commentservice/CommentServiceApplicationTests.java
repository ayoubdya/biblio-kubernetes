package com.biblio.commentservice;

import com.biblio.commentservice.config.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class CommentServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
