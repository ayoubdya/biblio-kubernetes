package com.biblio.commentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookRatingStats {

  private String bookKey;
  private Double averageRating;
  private Long totalComments;
  private Long rating5Count;
  private Long rating4Count;
  private Long rating3Count;
  private Long rating2Count;
  private Long rating1Count;
}
