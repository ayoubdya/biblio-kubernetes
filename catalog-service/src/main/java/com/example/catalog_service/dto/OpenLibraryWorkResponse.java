package com.example.catalog_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenLibraryWorkResponse {
  @JsonProperty("key")
  private String key;

  @JsonProperty("title")
  private String title;

  @JsonProperty("description")
  private Object description;

  @JsonProperty("covers")
  private List<Long> covers;

  @JsonProperty("subjects")
  private List<String> subjects;

  @JsonProperty("authors")
  private List<AuthorRef> authors;

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class AuthorRef {
    @JsonProperty("author")
    private AuthorKey author;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class AuthorKey {
    @JsonProperty("key")
    private String key;
  }
}
