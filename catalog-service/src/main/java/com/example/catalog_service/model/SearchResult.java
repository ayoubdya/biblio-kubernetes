package com.example.catalog_service.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResult {
  private Integer numFound;
  private Integer start;
  
  @JsonProperty("docs")
  private List<Book> books;
  
  private Integer limit;
}
