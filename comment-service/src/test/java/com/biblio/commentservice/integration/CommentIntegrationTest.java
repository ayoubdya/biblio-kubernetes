package com.biblio.commentservice.integration;

import com.biblio.commentservice.dto.CreateCommentRequest;
import com.biblio.commentservice.dto.UpdateCommentRequest;
import com.biblio.commentservice.entity.Comment;
import com.biblio.commentservice.repository.CommentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommentIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private CommentRepository commentRepository;

  @BeforeEach
  void setUp() {
    commentRepository.deleteAll();
  }

  @Test
  @DisplayName("Should create, read, update, and delete a comment")
  void shouldPerformCRUDOperations() throws Exception {
    // Create
    CreateCommentRequest createRequest = CreateCommentRequest.builder()
        .bookKey("OL27448W")
        .userId("user123")
        .username("testuser")
        .content("Great book!")
        .rating(5)
        .build();

    String createResponse = mockMvc.perform(post("/api/comments")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(createRequest)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id", notNullValue()))
        .andExpect(jsonPath("$.bookKey", is("OL27448W")))
        .andExpect(jsonPath("$.content", is("Great book!")))
        .andReturn()
        .getResponse()
        .getContentAsString();

    Long commentId = objectMapper.readTree(createResponse).get("id").asLong();

    // Read
    mockMvc.perform(get("/api/comments/" + commentId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id", is(commentId.intValue())))
        .andExpect(jsonPath("$.bookKey", is("OL27448W")));

    // Update
    UpdateCommentRequest updateRequest = UpdateCommentRequest.builder()
        .content("Updated: Even better than I thought!")
        .rating(4)
        .build();

    mockMvc.perform(put("/api/comments/" + commentId)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", is("Updated: Even better than I thought!")))
        .andExpect(jsonPath("$.rating", is(4)));

    // Delete
    mockMvc.perform(delete("/api/comments/" + commentId))
        .andExpect(status().isNoContent());

    // Verify deleted
    mockMvc.perform(get("/api/comments/" + commentId))
        .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("Should return comments for a book with pagination")
  void shouldReturnCommentsForBookWithPagination() throws Exception {
    // Create multiple comments
    for (int i = 0; i < 15; i++) {
      Comment comment = Comment.builder()
          .bookKey("OL27448W")
          .userId("user" + i)
          .username("User " + i)
          .content("Comment " + i)
          .rating((i % 5) + 1)
          .createdAt(LocalDateTime.now())
          .updatedAt(LocalDateTime.now())
          .build();
      commentRepository.save(comment);
    }

    // Get first page
    mockMvc.perform(get("/api/comments/book/OL27448W")
        .param("page", "0")
        .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(10)))
        .andExpect(jsonPath("$.totalElements", is(15)))
        .andExpect(jsonPath("$.totalPages", is(2)));

    // Get second page
    mockMvc.perform(get("/api/comments/book/OL27448W")
        .param("page", "1")
        .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(5)));
  }

  @Test
  @DisplayName("Should return rating statistics for a book")
  void shouldReturnRatingStatsForBook() throws Exception {
    // Create comments with different ratings
    int[] ratings = { 5, 5, 4, 4, 3 };
    for (int i = 0; i < ratings.length; i++) {
      Comment comment = Comment.builder()
          .bookKey("OL27448W")
          .userId("user" + i)
          .username("User " + i)
          .content("Comment " + i)
          .rating(ratings[i])
          .createdAt(LocalDateTime.now())
          .updatedAt(LocalDateTime.now())
          .build();
      commentRepository.save(comment);
    }

    mockMvc.perform(get("/api/comments/book/OL27448W/stats"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.bookKey", is("OL27448W")))
        .andExpect(jsonPath("$.totalComments", is(5)))
        .andExpect(jsonPath("$.averageRating", is(4.2)))
        .andExpect(jsonPath("$.rating5Count", is(2)))
        .andExpect(jsonPath("$.rating4Count", is(2)))
        .andExpect(jsonPath("$.rating3Count", is(1)));
  }

  @Test
  @DisplayName("Should prevent duplicate comments from same user on same book")
  void shouldPreventDuplicateComments() throws Exception {
    CreateCommentRequest request = CreateCommentRequest.builder()
        .bookKey("OL27448W")
        .userId("user123")
        .username("testuser")
        .content("First comment")
        .rating(5)
        .build();

    // First comment should succeed
    mockMvc.perform(post("/api/comments")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    // Second comment from same user on same book should fail
    request.setContent("Second comment");
    mockMvc.perform(post("/api/comments")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isConflict());
  }

  @Test
  @DisplayName("Should validate request body")
  void shouldValidateRequestBody() throws Exception {
    // Missing required fields
    CreateCommentRequest invalidRequest = CreateCommentRequest.builder()
        .bookKey("")
        .userId("")
        .username("")
        .content("")
        .rating(null)
        .build();

    mockMvc.perform(post("/api/comments")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(invalidRequest)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors", notNullValue()));
  }

  @Test
  @DisplayName("Should check if user has commented on book")
  void shouldCheckIfUserHasCommented() throws Exception {
    // Initially false
    mockMvc.perform(get("/api/comments/book/OL27448W/user/user123/exists"))
        .andExpect(status().isOk())
        .andExpect(content().string("false"));

    // Create comment
    Comment comment = Comment.builder()
        .bookKey("OL27448W")
        .userId("user123")
        .username("testuser")
        .content("Test comment")
        .rating(5)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();
    commentRepository.save(comment);

    // Now true
    mockMvc.perform(get("/api/comments/book/OL27448W/user/user123/exists"))
        .andExpect(status().isOk())
        .andExpect(content().string("true"));
  }
}
