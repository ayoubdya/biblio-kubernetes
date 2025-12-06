package com.example.catalog_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenLibraryAuthorWorksResponse {
  @JsonProperty("entries")
  private List<WorkEntry> entries;

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class WorkEntry {
    @JsonProperty("key")
    private String key;

    @JsonProperty("title")
    private String title;
  }
}
