package com.example.catalog_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenLibraryAuthorResponse {
  @JsonProperty("key")
  private String key;

  @JsonProperty("name")
  private String name;

  @JsonProperty("birth_date")
  private String birthDate;

  @JsonProperty("death_date")
  private String deathDate;

  @JsonProperty("bio")
  private Object bio;

  @JsonProperty("photos")
  private List<Long> photos;

  @JsonProperty("work_count")
  private Integer workCount;
}
