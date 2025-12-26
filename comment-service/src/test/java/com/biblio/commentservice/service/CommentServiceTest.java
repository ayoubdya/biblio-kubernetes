package com.biblio.commentservice.service;

import com.biblio.commentservice.dto.*;
import com.biblio.commentservice.entity.Comment;
import com.biblio.commentservice.exception.CommentNotFoundException;
import com.biblio.commentservice.exception.DuplicateCommentException;
import com.biblio.commentservice.mapper.CommentMapper;
import com.biblio.commentservice.repository.CommentRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

  @Mock
  private CommentRepository commentRepository;

  private CommentMapper commentMapper;
  private MeterRegistry meterRegistry;
  private CommentService commentService;

  private Comment sampleComment;
  private CreateCommentRequest createRequest;
  private UpdateCommentRequest updateRequest;

  @BeforeEach
  void setUp() {
    commentMapper = new CommentMapper();
    meterRegistry = new SimpleMeterRegistry();
    commentService = new CommentService(commentRepository, commentMapper, meterRegistry);

    sampleComment = Comment.builder()
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
  @DisplayName("createComment")
  class CreateComment {

    @Test
    @DisplayName("Should create comment successfully")
    void shouldCreateCommentSuccessfully() {
      when(commentRepository.existsByBookKeyAndUserId("OL27448W", "user123"))
          .thenReturn(false);
      when(commentRepository.save(any(Comment.class))).thenReturn(sampleComment);

      CommentResponse result = commentService.createComment(createRequest);

      assertThat(result).isNotNull();
      assertThat(result.getId()).isEqualTo(1L);
      assertThat(result.getBookKey()).isEqualTo("OL27448W");
      assertThat(result.getUserId()).isEqualTo("user123");
      assertThat(result.getContent()).isEqualTo("Great book!");
      assertThat(result.getRating()).isEqualTo(5);

      verify(commentRepository).save(any(Comment.class));
    }

    @Test
    @DisplayName("Should throw DuplicateCommentException when user already commented")
    void shouldThrowDuplicateCommentException() {
      when(commentRepository.existsByBookKeyAndUserId("OL27448W", "user123"))
          .thenReturn(true);

      assertThatThrownBy(() -> commentService.createComment(createRequest))
          .isInstanceOf(DuplicateCommentException.class)
          .hasMessageContaining("user123")
          .hasMessageContaining("OL27448W");

      verify(commentRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("getCommentById")
  class GetCommentById {

    @Test
    @DisplayName("Should return comment when found")
    void shouldReturnCommentWhenFound() {
      when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleComment));

      CommentResponse result = commentService.getCommentById(1L);

      assertThat(result).isNotNull();
      assertThat(result.getId()).isEqualTo(1L);
      assertThat(result.getBookKey()).isEqualTo("OL27448W");
    }

    @Test
    @DisplayName("Should throw CommentNotFoundException when not found")
    void shouldThrowCommentNotFoundException() {
      when(commentRepository.findById(999L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> commentService.getCommentById(999L))
          .isInstanceOf(CommentNotFoundException.class)
          .hasMessageContaining("999");
    }
  }

  @Nested
  @DisplayName("getCommentsByBookKey")
  class GetCommentsByBookKey {

    @Test
    @DisplayName("Should return paginated comments for book")
    void shouldReturnPaginatedCommentsForBook() {
      List<Comment> comments = Arrays.asList(sampleComment);
      Page<Comment> page = new PageImpl<>(comments, PageRequest.of(0, 10), 1);
      Pageable pageable = PageRequest.of(0, 10);

      when(commentRepository.findByBookKeyOrderByCreatedAtDesc("OL27448W", pageable))
          .thenReturn(page);

      Page<CommentResponse> result = commentService.getCommentsByBookKey("OL27448W", pageable);

      assertThat(result.getContent()).hasSize(1);
      assertThat(result.getContent().get(0).getBookKey()).isEqualTo("OL27448W");
      assertThat(result.getTotalElements()).isEqualTo(1);
    }
  }

  @Nested
  @DisplayName("getCommentsByUserId")
  class GetCommentsByUserId {

    @Test
    @DisplayName("Should return paginated comments for user")
    void shouldReturnPaginatedCommentsForUser() {
      List<Comment> comments = Arrays.asList(sampleComment);
      Page<Comment> page = new PageImpl<>(comments, PageRequest.of(0, 10), 1);
      Pageable pageable = PageRequest.of(0, 10);

      when(commentRepository.findByUserIdOrderByCreatedAtDesc("user123", pageable))
          .thenReturn(page);

      Page<CommentResponse> result = commentService.getCommentsByUserId("user123", pageable);

      assertThat(result.getContent()).hasSize(1);
      assertThat(result.getContent().get(0).getUserId()).isEqualTo("user123");
    }
  }

  @Nested
  @DisplayName("updateComment")
  class UpdateComment {

    @Test
    @DisplayName("Should update comment successfully")
    void shouldUpdateCommentSuccessfully() {
      Comment updatedComment = Comment.builder()
          .id(1L)
          .bookKey("OL27448W")
          .userId("user123")
          .username("testuser")
          .content("Updated review")
          .rating(4)
          .createdAt(LocalDateTime.now())
          .updatedAt(LocalDateTime.now())
          .build();

      when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleComment));
      when(commentRepository.save(any(Comment.class))).thenReturn(updatedComment);

      CommentResponse result = commentService.updateComment(1L, updateRequest);

      assertThat(result.getContent()).isEqualTo("Updated review");
      assertThat(result.getRating()).isEqualTo(4);

      verify(commentRepository).save(any(Comment.class));
    }

    @Test
    @DisplayName("Should throw CommentNotFoundException when updating non-existent comment")
    void shouldThrowCommentNotFoundExceptionWhenUpdating() {
      when(commentRepository.findById(999L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> commentService.updateComment(999L, updateRequest))
          .isInstanceOf(CommentNotFoundException.class);

      verify(commentRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("deleteComment")
  class DeleteComment {

    @Test
    @DisplayName("Should delete comment successfully")
    void shouldDeleteCommentSuccessfully() {
      when(commentRepository.existsById(1L)).thenReturn(true);
      doNothing().when(commentRepository).deleteById(1L);

      commentService.deleteComment(1L);

      verify(commentRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Should throw CommentNotFoundException when deleting non-existent comment")
    void shouldThrowCommentNotFoundExceptionWhenDeleting() {
      when(commentRepository.existsById(999L)).thenReturn(false);

      assertThatThrownBy(() -> commentService.deleteComment(999L))
          .isInstanceOf(CommentNotFoundException.class);

      verify(commentRepository, never()).deleteById(any());
    }
  }

  @Nested
  @DisplayName("getBookRatingStats")
  class GetBookRatingStats {

    @Test
    @DisplayName("Should return rating statistics for book")
    void shouldReturnRatingStatsForBook() {
      when(commentRepository.findAverageRatingByBookKey("OL27448W")).thenReturn(4.5);
      when(commentRepository.countByBookKey("OL27448W")).thenReturn(10L);
      when(commentRepository.countByBookKeyGroupByRating("OL27448W"))
          .thenReturn(Arrays.asList(
              new Object[] { 5, 5L },
              new Object[] { 4, 3L },
              new Object[] { 3, 1L },
              new Object[] { 2, 1L }));

      BookRatingStats result = commentService.getBookRatingStats("OL27448W");

      assertThat(result.getBookKey()).isEqualTo("OL27448W");
      assertThat(result.getAverageRating()).isEqualTo(4.5);
      assertThat(result.getTotalComments()).isEqualTo(10L);
      assertThat(result.getRating5Count()).isEqualTo(5L);
      assertThat(result.getRating4Count()).isEqualTo(3L);
      assertThat(result.getRating3Count()).isEqualTo(1L);
      assertThat(result.getRating2Count()).isEqualTo(1L);
      assertThat(result.getRating1Count()).isEqualTo(0L);
    }

    @Test
    @DisplayName("Should return zero average when no comments exist")
    void shouldReturnZeroAverageWhenNoComments() {
      when(commentRepository.findAverageRatingByBookKey("OL99999W")).thenReturn(null);
      when(commentRepository.countByBookKey("OL99999W")).thenReturn(0L);
      when(commentRepository.countByBookKeyGroupByRating("OL99999W"))
          .thenReturn(Arrays.asList());

      BookRatingStats result = commentService.getBookRatingStats("OL99999W");

      assertThat(result.getAverageRating()).isEqualTo(0.0);
      assertThat(result.getTotalComments()).isEqualTo(0L);
    }
  }

  @Nested
  @DisplayName("hasUserCommented")
  class HasUserCommented {

    @Test
    @DisplayName("Should return true when user has commented")
    void shouldReturnTrueWhenUserCommented() {
      when(commentRepository.existsByBookKeyAndUserId("OL27448W", "user123"))
          .thenReturn(true);

      boolean result = commentService.hasUserCommented("OL27448W", "user123");

      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false when user has not commented")
    void shouldReturnFalseWhenUserNotCommented() {
      when(commentRepository.existsByBookKeyAndUserId("OL27448W", "user456"))
          .thenReturn(false);

      boolean result = commentService.hasUserCommented("OL27448W", "user456");

      assertThat(result).isFalse();
    }
  }

  @Nested
  @DisplayName("getUserCommentOnBook")
  class GetUserCommentOnBook {

    @Test
    @DisplayName("Should return user comment on book")
    void shouldReturnUserCommentOnBook() {
      when(commentRepository.findByBookKeyAndUserId("OL27448W", "user123"))
          .thenReturn(Optional.of(sampleComment));

      CommentResponse result = commentService.getUserCommentOnBook("OL27448W", "user123");

      assertThat(result).isNotNull();
      assertThat(result.getBookKey()).isEqualTo("OL27448W");
      assertThat(result.getUserId()).isEqualTo("user123");
    }

    @Test
    @DisplayName("Should throw CommentNotFoundException when user comment not found")
    void shouldThrowCommentNotFoundExceptionWhenNotFound() {
      when(commentRepository.findByBookKeyAndUserId("OL27448W", "user456"))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() -> commentService.getUserCommentOnBook("OL27448W", "user456"))
          .isInstanceOf(CommentNotFoundException.class);
    }
  }
}
