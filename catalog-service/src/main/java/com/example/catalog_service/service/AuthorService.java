package com.example.catalog_service.service;

import com.example.catalog_service.client.OpenLibraryClient;
import com.example.catalog_service.dto.OpenLibraryAuthorResponse;
import com.example.catalog_service.dto.OpenLibraryAuthorWorksResponse;
import com.example.catalog_service.exception.ResourceNotFoundException;
import com.example.catalog_service.model.Author;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthorService {

  private final OpenLibraryClient openLibraryClient;

  public Author getAuthorByKey(String authorKey) {
    log.info("Fetching author details for key: {}", authorKey);

    String normalizedKey = authorKey.startsWith("/authors/") ? authorKey : "/authors/" + authorKey;

    OpenLibraryAuthorResponse response = openLibraryClient.getAuthorByKey(normalizedKey);

    if (response == null) {
      throw new ResourceNotFoundException("Author with key " + authorKey + " not found");
    }

    return mapToAuthor(response);
  }

  public Author getAuthorWithWorks(String authorKey, Integer limit) {
    log.info("Fetching author with works for key: {}", authorKey);

    Author author = getAuthorByKey(authorKey);

    String normalizedKey = authorKey.startsWith("/authors/") ? authorKey : "/authors/" + authorKey;
    OpenLibraryAuthorWorksResponse worksResponse = openLibraryClient.getAuthorWorks(normalizedKey, limit);

    if (worksResponse != null && worksResponse.getEntries() != null) {
      List<String> topWorks = worksResponse.getEntries().stream()
          .map(OpenLibraryAuthorWorksResponse.WorkEntry::getTitle)
          .collect(Collectors.toList());
      author.setTopWorks(topWorks);
    }

    return author;
  }

  private Author mapToAuthor(OpenLibraryAuthorResponse response) {
    String bio = extractBio(response.getBio());

    String photoUrl = response.getPhotos() != null && !response.getPhotos().isEmpty()
        ? openLibraryClient.buildAuthorPhotoUrl(response.getPhotos().get(0), "M")
        : null;

    return Author.builder()
        .key(response.getKey())
        .name(response.getName())
        .birthDate(response.getBirthDate())
        .deathDate(response.getDeathDate())
        .bio(bio)
        .photoUrl(photoUrl)
        .workCount(response.getWorkCount())
        .topWorks(new ArrayList<>())
        .build();
  }

  private String extractBio(Object bio) {
    if (bio == null) {
      return null;
    }

    if (bio instanceof String) {
      return (String) bio;
    }

    if (bio instanceof java.util.Map) {
      @SuppressWarnings("unchecked")
      java.util.Map<String, Object> bioMap = (java.util.Map<String, Object>) bio;
      Object value = bioMap.get("value");
      return value != null ? value.toString() : null;
    }

    return bio.toString();
  }
}
