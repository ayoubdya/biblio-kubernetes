package com.biblio.commentservice.controller;

import com.biblio.commentservice.dto.*;
import com.biblio.commentservice.security.JwtUtils;
import com.biblio.commentservice.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class CommentController {

  private final CommentService commentService;
  private final JwtUtils jwtUtils;

  @PostMapping
  public ResponseEntity<CommentResponse> createComment(
      @Valid @RequestBody CreateCommentRequest request,
      @AuthenticationPrincipal Jwt jwt) {

    request.setUserId(jwt.getSubject());
    request.setUsername(jwt.getClaimAsString("preferred_username"));

    log.info("POST /api/comments - Creating comment for book: {} by user: {}",
        request.getBookKey(), request.getUsername());
    CommentResponse response = commentService.createComment(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<CommentResponse> getCommentById(@PathVariable Long id) {
    log.info("GET /api/comments/{} - Fetching comment", id);
    CommentResponse response = commentService.getCommentById(id);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/book/{bookKey}")
  public ResponseEntity<Page<CommentResponse>> getCommentsByBookKey(
      @PathVariable String bookKey,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    log.info("GET /api/comments/book/{} - Fetching comments", bookKey);
    Pageable pageable = PageRequest.of(page, size);
    Page<CommentResponse> comments = commentService.getCommentsByBookKey(bookKey, pageable);
    return ResponseEntity.ok(comments);
  }

  @GetMapping("/user/{userId}")
  public ResponseEntity<Page<CommentResponse>> getCommentsByUserId(
      @PathVariable String userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    log.info("GET /api/comments/user/{} - Fetching comments", userId);
    Pageable pageable = PageRequest.of(page, size);
    Page<CommentResponse> comments = commentService.getCommentsByUserId(userId, pageable);
    return ResponseEntity.ok(comments);
  }

  @PutMapping("/{id}")
  public ResponseEntity<CommentResponse> updateComment(
      @PathVariable Long id,
      @Valid @RequestBody UpdateCommentRequest request,
      @AuthenticationPrincipal Jwt jwt) {

    String currentUserId = jwt.getSubject();
    log.info("PUT /api/comments/{} - Updating comment by user: {}", id, currentUserId);

    CommentResponse response = commentService.updateComment(id, request, currentUserId);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteComment(
      @PathVariable Long id,
      @AuthenticationPrincipal Jwt jwt) {

    String currentUserId = jwt.getSubject();
    log.info("DELETE /api/comments/{} - Deleting comment by user: {}", id, currentUserId);

    commentService.deleteComment(id, currentUserId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/book/{bookKey}/me")
  public ResponseEntity<CommentResponse> getMyCommentOnBook(
      @PathVariable String bookKey,
      @AuthenticationPrincipal Jwt jwt) {

    String currentUserId = jwt.getSubject();
    log.info("GET /api/comments/book/{}/me - Fetching current user's comment", bookKey);
    CommentResponse response = commentService.getUserCommentOnBook(bookKey, currentUserId);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/book/{bookKey}/stats")
  public ResponseEntity<BookRatingStats> getBookRatingStats(@PathVariable String bookKey) {
    log.info("GET /api/comments/book/{}/stats - Fetching rating stats", bookKey);
    BookRatingStats stats = commentService.getBookRatingStats(bookKey);
    return ResponseEntity.ok(stats);
  }

  @GetMapping("/book/{bookKey}/user/{userId}/exists")
  public ResponseEntity<Boolean> hasUserCommented(
      @PathVariable String bookKey,
      @PathVariable String userId) {
    log.info("GET /api/comments/book/{}/user/{}/exists - Checking if user commented", bookKey, userId);
    boolean hasCommented = commentService.hasUserCommented(bookKey, userId);
    return ResponseEntity.ok(hasCommented);
  }

  @GetMapping("/book/{bookKey}/user/{userId}")
  public ResponseEntity<CommentResponse> getUserCommentOnBook(
      @PathVariable String bookKey,
      @PathVariable String userId) {
    log.info("GET /api/comments/book/{}/user/{} - Fetching user comment", bookKey, userId);
    CommentResponse response = commentService.getUserCommentOnBook(bookKey, userId);
    return ResponseEntity.ok(response);
  }
}
