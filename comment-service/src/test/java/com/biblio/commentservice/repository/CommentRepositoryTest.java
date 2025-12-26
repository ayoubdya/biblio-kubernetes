package com.biblio.commentservice.repository;

import com.biblio.commentservice.entity.Comment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class CommentRepositoryTest {

  @Autowired
  private CommentRepository commentRepository;

  private Comment comment1;
  private Comment comment2;
  private Comment comment3;

  @BeforeEach
  void setUp() {
    commentRepository.deleteAll();

    comment1 = Comment.builder()
        .bookKey("OL27448W")
        .userId("user1")
        .username("User One")
        .content("Great book!")
        .rating(5)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();

    comment2 = Comment.builder()
        .bookKey("OL27448W")
        .userId("user2")
        .username("User Two")
        .content("Good book")
        .rating(4)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();

    comment3 = Comment.builder()
        .bookKey("OL12345W")
        .userId("user1")
        .username("User One")
        .content("Another review")
        .rating(3)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();

    commentRepository.saveAll(List.of(comment1, comment2, comment3));
  }

  @Test
  @DisplayName("Should find comments by book key ordered by created date descending")
  void shouldFindByBookKeyOrderByCreatedAtDesc() {
    Page<Comment> result = commentRepository.findByBookKeyOrderByCreatedAtDesc(
        "OL27448W", PageRequest.of(0, 10));

    assertThat(result.getContent()).hasSize(2);
    assertThat(result.getContent()).allMatch(c -> c.getBookKey().equals("OL27448W"));
  }

  @Test
  @DisplayName("Should find comments by user ID ordered by created date descending")
  void shouldFindByUserIdOrderByCreatedAtDesc() {
    Page<Comment> result = commentRepository.findByUserIdOrderByCreatedAtDesc(
        "user1", PageRequest.of(0, 10));

    assertThat(result.getContent()).hasSize(2);
    assertThat(result.getContent()).allMatch(c -> c.getUserId().equals("user1"));
  }

  @Test
  @DisplayName("Should find comment by book key and user ID")
  void shouldFindByBookKeyAndUserId() {
    Optional<Comment> result = commentRepository.findByBookKeyAndUserId("OL27448W", "user1");

    assertThat(result).isPresent();
    assertThat(result.get().getContent()).isEqualTo("Great book!");
  }

  @Test
  @DisplayName("Should return empty when comment not found by book key and user ID")
  void shouldReturnEmptyWhenNotFoundByBookKeyAndUserId() {
    Optional<Comment> result = commentRepository.findByBookKeyAndUserId("OL27448W", "nonexistent");

    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("Should check if user has commented on book")
  void shouldCheckIfExistsByBookKeyAndUserId() {
    boolean exists = commentRepository.existsByBookKeyAndUserId("OL27448W", "user1");
    boolean notExists = commentRepository.existsByBookKeyAndUserId("OL27448W", "nonexistent");

    assertThat(exists).isTrue();
    assertThat(notExists).isFalse();
  }

  @Test
  @DisplayName("Should count comments by book key")
  void shouldCountByBookKey() {
    long count = commentRepository.countByBookKey("OL27448W");

    assertThat(count).isEqualTo(2);
  }

  @Test
  @DisplayName("Should calculate average rating by book key")
  void shouldFindAverageRatingByBookKey() {
    Double avgRating = commentRepository.findAverageRatingByBookKey("OL27448W");

    assertThat(avgRating).isEqualTo(4.5); // (5 + 4) / 2
  }

  @Test
  @DisplayName("Should return null average rating when no comments exist")
  void shouldReturnNullAverageRatingWhenNoComments() {
    Double avgRating = commentRepository.findAverageRatingByBookKey("nonexistent");

    assertThat(avgRating).isNull();
  }

  @Test
  @DisplayName("Should count comments grouped by rating")
  void shouldCountByBookKeyGroupByRating() {
    List<Object[]> result = commentRepository.countByBookKeyGroupByRating("OL27448W");

    assertThat(result).hasSize(2);
  }

  @Test
  @DisplayName("Should delete comments by book key")
  void shouldDeleteByBookKey() {
    commentRepository.deleteByBookKey("OL27448W");

    long count = commentRepository.countByBookKey("OL27448W");
    assertThat(count).isEqualTo(0);
  }

  @Test
  @DisplayName("Should delete comments by user ID")
  void shouldDeleteByUserId() {
    commentRepository.deleteByUserId("user1");

    Page<Comment> result = commentRepository.findByUserIdOrderByCreatedAtDesc(
        "user1", PageRequest.of(0, 10));
    assertThat(result.getContent()).isEmpty();
  }
}
