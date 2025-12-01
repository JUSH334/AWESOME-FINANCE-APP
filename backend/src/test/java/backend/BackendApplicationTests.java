package backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void contextLoads() {
        assertThat(applicationContext).isNotNull();
    }

    @Test
    void mainMethodShouldRun() {
        assertThatCode(() -> BackendApplication.main(new String[]{}))
            .doesNotThrowAnyException();
    }

    @Test
    void allBeansAreLoaded() {
        assertThat(applicationContext.getBeanDefinitionNames()).isNotEmpty();
    }
}