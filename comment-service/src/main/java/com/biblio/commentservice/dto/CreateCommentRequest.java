package com.biblio.commentservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {

  @NotBlank(message = "Book key is required")
  @Size(max = 50, message = "Book key must not exceed 50 characters")
  private String bookKey;

  @NotBlank(message = "User ID is required")
  private String userId;

  @NotBlank(message = "Username is required")
  private String username;

  @NotBlank(message = "Content is required")
  @Size(min = 1, max = 2000, message = "Content must be between 1 and 2000 characters")
  private String content;

  @NotNull(message = "Rating is required")
  @Min(value = 1, message = "Rating must be at least 1")
  @Max(value = 5, message = "Rating must not exceed 5")
  private Integer rating;
}
