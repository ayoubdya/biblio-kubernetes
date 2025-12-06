package com.example.catalog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {
  private String key;
  private String title;
  private List<String> authors;
  private String isbn;
  private Integer firstPublishYear;
  private Integer numberOfPages;
  private List<String> subjects;
  private String coverUrl;
  private String description;
  private List<String> publishers;
  private Double averageRating;
  private String language;
}
