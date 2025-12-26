package com.biblio.commentservice.mapper;

import com.biblio.commentservice.dto.CommentResponse;
import com.biblio.commentservice.dto.CreateCommentRequest;
import com.biblio.commentservice.entity.Comment;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper {

  public Comment toEntity(CreateCommentRequest request) {
    return Comment.builder()
        .bookKey(request.getBookKey())
        .userId(request.getUserId())
        .username(request.getUsername())
        .content(request.getContent())
        .rating(request.getRating())
        .build();
  }

  public CommentResponse toResponse(Comment comment) {
    return CommentResponse.builder()
        .id(comment.getId())
        .bookKey(comment.getBookKey())
        .userId(comment.getUserId())
        .username(comment.getUsername())
        .content(comment.getContent())
        .rating(comment.getRating())
        .createdAt(comment.getCreatedAt())
        .updatedAt(comment.getUpdatedAt())
        .build();
  }
}
