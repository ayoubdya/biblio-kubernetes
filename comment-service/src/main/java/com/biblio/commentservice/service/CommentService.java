package com.biblio.commentservice.service;

import com.biblio.commentservice.dto.*;
import com.biblio.commentservice.entity.Comment;
import com.biblio.commentservice.exception.CommentNotFoundException;
import com.biblio.commentservice.exception.DuplicateCommentException;
import com.biblio.commentservice.exception.UnauthorizedAccessException;
import com.biblio.commentservice.mapper.CommentMapper;
import com.biblio.commentservice.repository.CommentRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@Transactional
public class CommentService {

  private final CommentRepository commentRepository;
  private final CommentMapper commentMapper;
  private final Counter commentsCreatedCounter;
  private final Counter commentsDeletedCounter;

  public CommentService(CommentRepository commentRepository,
      CommentMapper commentMapper,
      MeterRegistry meterRegistry) {
    this.commentRepository = commentRepository;
    this.commentMapper = commentMapper;

    this.commentsCreatedCounter = Counter.builder("comments_created_total")
        .description("Total number of comments created")
        .register(meterRegistry);

    this.commentsDeletedCounter = Counter.builder("comments_deleted_total")
        .description("Total number of comments deleted")
        .register(meterRegistry);
  }

  public CommentResponse createComment(CreateCommentRequest request) {
    log.info("Creating comment for book: {} by user: {}", request.getBookKey(), request.getUserId());

    if (commentRepository.existsByBookKeyAndUserId(request.getBookKey(), request.getUserId())) {
      throw new DuplicateCommentException(request.getBookKey(), request.getUserId());
    }

    Comment comment = commentMapper.toEntity(request);
    Comment savedComment = commentRepository.save(comment);

    commentsCreatedCounter.increment();
    log.info("Comment created with id: {}", savedComment.getId());

    return commentMapper.toResponse(savedComment);
  }

  @Transactional(readOnly = true)
  public CommentResponse getCommentById(Long id) {
    log.debug("Fetching comment with id: {}", id);
    Comment comment = commentRepository.findById(id)
        .orElseThrow(() -> new CommentNotFoundException(id));
    return commentMapper.toResponse(comment);
  }

  @Transactional(readOnly = true)
  public Page<CommentResponse> getCommentsByBookKey(String bookKey, Pageable pageable) {
    log.debug("Fetching comments for book: {}", bookKey);
    return commentRepository.findByBookKeyOrderByCreatedAtDesc(bookKey, pageable)
        .map(commentMapper::toResponse);
  }

  @Transactional(readOnly = true)
  public Page<CommentResponse> getCommentsByUserId(String userId, Pageable pageable) {
    log.debug("Fetching comments by user: {}", userId);
    return commentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
        .map(commentMapper::toResponse);
  }

  public CommentResponse updateComment(Long id, UpdateCommentRequest request, String currentUserId) {
    log.info("Updating comment with id: {} by user: {}", id, currentUserId);

    Comment comment = commentRepository.findById(id)
        .orElseThrow(() -> new CommentNotFoundException(id));

    if (!comment.getUserId().equals(currentUserId)) {
      throw new UnauthorizedAccessException(id, currentUserId);
    }

    comment.setContent(request.getContent());
    comment.setRating(request.getRating());

    Comment updatedComment = commentRepository.save(comment);
    log.info("Comment updated with id: {}", id);

    return commentMapper.toResponse(updatedComment);
  }

  public CommentResponse updateComment(Long id, UpdateCommentRequest request) {
    Comment comment = commentRepository.findById(id)
        .orElseThrow(() -> new CommentNotFoundException(id));
    comment.setContent(request.getContent());
    comment.setRating(request.getRating());
    return commentMapper.toResponse(commentRepository.save(comment));
  }

  public void deleteComment(Long id, String currentUserId) {
    log.info("Deleting comment with id: {} by user: {}", id, currentUserId);

    Comment comment = commentRepository.findById(id)
        .orElseThrow(() -> new CommentNotFoundException(id));

    if (!comment.getUserId().equals(currentUserId)) {
      throw new UnauthorizedAccessException(id, currentUserId);
    }

    commentRepository.deleteById(id);
    commentsDeletedCounter.increment();
    log.info("Comment deleted with id: {}", id);
  }

  public void deleteComment(Long id) {
    if (!commentRepository.existsById(id)) {
      throw new CommentNotFoundException(id);
    }
    commentRepository.deleteById(id);
    commentsDeletedCounter.increment();
  }

  @Transactional(readOnly = true)
  public BookRatingStats getBookRatingStats(String bookKey) {
    log.debug("Fetching rating stats for book: {}", bookKey);

    Double averageRating = commentRepository.findAverageRatingByBookKey(bookKey);
    long totalComments = commentRepository.countByBookKey(bookKey);
    List<Object[]> ratingCounts = commentRepository.countByBookKeyGroupByRating(bookKey);

    Map<Integer, Long> ratingMap = new HashMap<>();
    for (int i = 1; i <= 5; i++) {
      ratingMap.put(i, 0L);
    }

    for (Object[] row : ratingCounts) {
      Integer rating = (Integer) row[0];
      Long count = (Long) row[1];
      ratingMap.put(rating, count);
    }

    return BookRatingStats.builder()
        .bookKey(bookKey)
        .averageRating(averageRating != null ? Math.round(averageRating * 100.0) / 100.0 : 0.0)
        .totalComments(totalComments)
        .rating5Count(ratingMap.get(5))
        .rating4Count(ratingMap.get(4))
        .rating3Count(ratingMap.get(3))
        .rating2Count(ratingMap.get(2))
        .rating1Count(ratingMap.get(1))
        .build();
  }

  @Transactional(readOnly = true)
  public boolean hasUserCommented(String bookKey, String userId) {
    return commentRepository.existsByBookKeyAndUserId(bookKey, userId);
  }

  @Transactional(readOnly = true)
  public CommentResponse getUserCommentOnBook(String bookKey, String userId) {
    log.debug("Fetching comment by user: {} for book: {}", userId, bookKey);
    Comment comment = commentRepository.findByBookKeyAndUserId(bookKey, userId)
        .orElseThrow(() -> new CommentNotFoundException(
            "Comment not found for user " + userId + " on book " + bookKey));
    return commentMapper.toResponse(comment);
  }
}
