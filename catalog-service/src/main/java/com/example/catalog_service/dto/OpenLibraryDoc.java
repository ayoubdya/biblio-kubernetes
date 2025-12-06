package com.example.catalog_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenLibraryDoc {
  @JsonProperty("key")
  private String key;

  @JsonProperty("title")
  private String title;

  @JsonProperty("author_name")
  private List<String> authorName;

  @JsonProperty("isbn")
  private List<String> isbn;

  @JsonProperty("first_publish_year")
  private Integer firstPublishYear;

  @JsonProperty("number_of_pages_median")
  private Integer numberOfPagesMedian;

  @JsonProperty("subject")
  private List<String> subject;

  @JsonProperty("cover_i")
  private Long coverId;

  @JsonProperty("publisher")
  private List<String> publisher;

  @JsonProperty("ratings_average")
  private Double ratingsAverage;

  @JsonProperty("language")
  private List<String> language;
}
