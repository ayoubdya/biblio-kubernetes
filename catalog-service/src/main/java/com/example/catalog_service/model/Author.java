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
public class Author {
  private String key;
  private String name;
  private String birthDate;
  private String deathDate;
  private String bio;
  private List<String> topWorks;
  private Integer workCount;
  private String photoUrl;
}
