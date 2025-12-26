package com.biblio.commentservice.controller;

import com.biblio.commentservice.config.TestSecurityConfig;
import com.biblio.commentservice.dto.*;
import com.biblio.commentservice.exception.CommentNotFoundException;
import com.biblio.commentservice.exception.DuplicateCommentException;
import com.biblio.commentservice.security.JwtUtils;
import com.biblio.commentservice.service.CommentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class CommentControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @MockBean
  private CommentService commentService;

  @MockBean
  private JwtUtils jwtUtils;

  private CommentResponse sampleComment;
  private CreateCommentRequest createRequest;
  private UpdateCommentRequest updateRequest;

  @BeforeEach
  void setUp() {
    sampleComment = CommentResponse.builder()
        .id(1L)
        .bookKey("OL27448W")
        .userId("user123")
        .username("testuser")
        .content("Great book!")
        .rating(5)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();

    createRequest = CreateCommentRequest.builder()
        .bookKey("OL27448W")
        .userId("user123")
        .username("testuser")
        .content("Great book!")
        .rating(5)
        .build();

    updateRequest = UpdateCommentRequest.builder()
        .content("Updated review")
        .rating(4)
        .build();
  }

  @Nested
  @DisplayName("POST /api/comments")
  class CreateComment {

    @Test
    @DisplayName("Should create comment successfully")
    void shouldCreateCommentSuccessfully() throws Exception {
      when(commentService.createComment(any(CreateCommentRequest.class)))
          .thenReturn(sampleComment);

      mockMvc.perform(post("/api/comments")
          .with(jwt().jwt(builder -> builder
              .subject("user123")
              .claim("preferred_username", "testuser")))
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(createRequest)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.id", is(1)))
          .andExpect(jsonPath("$.bookKey", is("OL27448W")))
          .andExpect(jsonPath("$.userId", is("user123")))
          .andExpect(jsonPath("$.content", is("Great book!")))
          .andExpect(jsonPath("$.rating", is(5)));

      verify(commentService).createComment(any(CreateCommentRequest.class));
    }

    @Test
    @DisplayName("Should return 409 when user already commented")
    void shouldReturn409WhenDuplicateComment() throws Exception {
      when(commentService.createComment(any(CreateCommentRequest.class)))
          .thenThrow(new DuplicateCommentException("OL27448W", "user123"));

      mockMvc.perform(post("/api/comments")
          .with(jwt().jwt(builder -> builder
              .subject("user123")
              .claim("preferred_username", "testuser")))
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(createRequest)))
          .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Should return 400 when request is invalid")
    void shouldReturn400WhenInvalidRequest() throws Exception {
      CreateCommentRequest invalidRequest = CreateCommentRequest.builder()
          .bookKey("") // Invalid: blank
          .userId("user123")
          .username("testuser")
          .content("Great book!")
          .rating(6) // Invalid: > 5
          .build();

      mockMvc.perform(post("/api/comments")
          .with(jwt().jwt(builder -> builder
              .subject("user123")
              .claim("preferred_username", "testuser")))
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest());
    }
  }

  @Nested
  @DisplayName("GET /api/comments/{id}")
  class GetCommentById {

    @Test
    @DisplayName("Should return comment when found")
    void shouldReturnCommentWhenFound() throws Exception {
      when(commentService.getCommentById(1L)).thenReturn(sampleComment);

      mockMvc.perform(get("/api/comments/1"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id", is(1)))
          .andExpect(jsonPath("$.bookKey", is("OL27448W")));
    }

    @Test
    @DisplayName("Should return 404 when comment not found")
    void shouldReturn404WhenNotFound() throws Exception {
      when(commentService.getCommentById(999L))
          .thenThrow(new CommentNotFoundException(999L));

      mockMvc.perform(get("/api/comments/999"))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("GET /api/comments/book/{bookKey}")
  class GetCommentsByBookKey {

    @Test
    @DisplayName("Should return paginated comments for book")
    void shouldReturnPaginatedCommentsForBook() throws Exception {
      List<CommentResponse> comments = Arrays.asList(sampleComment);
      Page<CommentResponse> page = new PageImpl<>(comments, PageRequest.of(0, 10), 1);

      when(commentService.getCommentsByBookKey(eq("OL27448W"), any()))
          .thenReturn(page);

      mockMvc.perform(get("/api/comments/book/OL27448W")
          .param("page", "0")
          .param("size", "10"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content", hasSize(1)))
          .andExpect(jsonPath("$.content[0].bookKey", is("OL27448W")))
          .andExpect(jsonPath("$.totalElements", is(1)));
    }
  }

  @Nested
  @DisplayName("GET /api/comments/user/{userId}")
  class GetCommentsByUserId {

    @Test
    @DisplayName("Should return paginated comments for user")
    void shouldReturnPaginatedCommentsForUser() throws Exception {
      List<CommentResponse> comments = Arrays.asList(sampleComment);
      Page<CommentResponse> page = new PageImpl<>(comments, PageRequest.of(0, 10), 1);

      when(commentService.getCommentsByUserId(eq("user123"), any()))
          .thenReturn(page);

      mockMvc.perform(get("/api/comments/user/user123"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content", hasSize(1)))
          .andExpect(jsonPath("$.content[0].userId", is("user123")));
    }
  }

  @Nested
  @DisplayName("PUT /api/comments/{id}")
  class UpdateComment {

    @Test
    @DisplayName("Should update comment successfully")
    void shouldUpdateCommentSuccessfully() throws Exception {
      CommentResponse updatedComment = CommentResponse.builder()
          .id(1L)
          .bookKey("OL27448W")
          .userId("user123")
          .username("testuser")
          .content("Updated review")
          .rating(4)
          .createdAt(LocalDateTime.now())
          .updatedAt(LocalDateTime.now())
          .build();

      when(commentService.updateComment(eq(1L), any(UpdateCommentRequest.class), eq("user123")))
          .thenReturn(updatedComment);

      mockMvc.perform(put("/api/comments/1")
          .with(jwt().jwt(builder -> builder.subject("user123")))
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(updateRequest)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content", is("Updated review")))
          .andExpect(jsonPath("$.rating", is(4)));
    }

    @Test
    @DisplayName("Should return 404 when updating non-existent comment")
    void shouldReturn404WhenUpdatingNonExistent() throws Exception {
      when(commentService.updateComment(eq(999L), any(UpdateCommentRequest.class), eq("user123")))
          .thenThrow(new CommentNotFoundException(999L));

      mockMvc.perform(put("/api/comments/999")
          .with(jwt().jwt(builder -> builder.subject("user123")))
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(updateRequest)))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("DELETE /api/comments/{id}")
  class DeleteComment {

    @Test
    @DisplayName("Should delete comment successfully")
    void shouldDeleteCommentSuccessfully() throws Exception {
      doNothing().when(commentService).deleteComment(1L, "user123");

      mockMvc.perform(delete("/api/comments/1")
          .with(jwt().jwt(builder -> builder.subject("user123"))))
          .andExpect(status().isNoContent());

      verify(commentService).deleteComment(1L, "user123");
    }

    @Test
    @DisplayName("Should return 404 when deleting non-existent comment")
    void shouldReturn404WhenDeletingNonExistent() throws Exception {
      doThrow(new CommentNotFoundException(999L))
          .when(commentService).deleteComment(999L, "user123");

      mockMvc.perform(delete("/api/comments/999")
          .with(jwt().jwt(builder -> builder.subject("user123"))))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("GET /api/comments/book/{bookKey}/stats")
  class GetBookRatingStats {

    @Test
    @DisplayName("Should return rating statistics for book")
    void shouldReturnRatingStatsForBook() throws Exception {
      BookRatingStats stats = BookRatingStats.builder()
          .bookKey("OL27448W")
          .averageRating(4.5)
          .totalComments(10L)
          .rating5Count(5L)
          .rating4Count(3L)
          .rating3Count(1L)
          .rating2Count(1L)
          .rating1Count(0L)
          .build();

      when(commentService.getBookRatingStats("OL27448W")).thenReturn(stats);

      mockMvc.perform(get("/api/comments/book/OL27448W/stats"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.bookKey", is("OL27448W")))
          .andExpect(jsonPath("$.averageRating", is(4.5)))
          .andExpect(jsonPath("$.totalComments", is(10)))
          .andExpect(jsonPath("$.rating5Count", is(5)));
    }
  }

  @Nested
  @DisplayName("GET /api/comments/book/{bookKey}/user/{userId}/exists")
  class HasUserCommented {

    @Test
    @DisplayName("Should return true when user has commented")
    void shouldReturnTrueWhenUserCommented() throws Exception {
      when(commentService.hasUserCommented("OL27448W", "user123")).thenReturn(true);

      mockMvc.perform(get("/api/comments/book/OL27448W/user/user123/exists"))
          .andExpect(status().isOk())
          .andExpect(content().string("true"));
    }

    @Test
    @DisplayName("Should return false when user has not commented")
    void shouldReturnFalseWhenUserNotCommented() throws Exception {
      when(commentService.hasUserCommented("OL27448W", "user456")).thenReturn(false);

      mockMvc.perform(get("/api/comments/book/OL27448W/user/user456/exists"))
          .andExpect(status().isOk())
          .andExpect(content().string("false"));
    }
  }
}
