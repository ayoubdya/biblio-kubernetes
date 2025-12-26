package com.biblio.commentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

  private Long id;
  private String bookKey;
  private String userId;
  private String username;
  private String content;
  private Integer rating;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
