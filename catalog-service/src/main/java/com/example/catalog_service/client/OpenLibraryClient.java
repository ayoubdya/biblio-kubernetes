package com.example.catalog_service.client;

import com.example.catalog_service.dto.*;
import com.example.catalog_service.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
public class OpenLibraryClient {

  private final RestClient restClient;

  @Value("${openlibrary.api.base-url}")
  private String baseUrl;

  @Value("${openlibrary.api.covers-url}")
  private String coversUrl;

  public OpenLibraryClient(RestClient.Builder restClientBuilder) {
    this.restClient = restClientBuilder.build();
  }

  public OpenLibrarySearchResponse searchBooks(String query, Integer page, Integer limit) {
    try {
      int offset = (page != null && page > 0) ? (page - 1) * (limit != null ? limit : 10) : 0;
      int pageSize = limit != null ? limit : 10;

      String url = String.format("%s/search.json?q=%s&offset=%d&limit=%d",
          baseUrl, query, offset, pageSize);

      log.info("Searching books with query: {}, page: {}, limit: {}", query, page, limit);

      return restClient.get()
          .uri(url)
          .retrieve()
          .body(OpenLibrarySearchResponse.class);

    } catch (RestClientException e) {
      log.error("Error searching books: {}", e.getMessage());
      throw new ExternalApiException("Failed to search books from OpenLibrary", e);
    }
  }

  public OpenLibrarySearchResponse searchByTitle(String title, Integer page, Integer limit) {
    try {
      int offset = (page != null && page > 0) ? (page - 1) * (limit != null ? limit : 10) : 0;
      int pageSize = limit != null ? limit : 10;

      String url = String.format("%s/search.json?title=%s&offset=%d&limit=%d",
          baseUrl, title, offset, pageSize);

      log.info("Searching books by title: {}", title);

      return restClient.get()
          .uri(url)
          .retrieve()
          .body(OpenLibrarySearchResponse.class);

    } catch (RestClientException e) {
      log.error("Error searching books by title: {}", e.getMessage());
      throw new ExternalApiException("Failed to search books by title", e);
    }
  }

  public OpenLibrarySearchResponse searchByAuthor(String author, Integer page, Integer limit) {
    try {
      int offset = (page != null && page > 0) ? (page - 1) * (limit != null ? limit : 10) : 0;
      int pageSize = limit != null ? limit : 10;

      String url = String.format("%s/search.json?author=%s&offset=%d&limit=%d",
          baseUrl, author, offset, pageSize);

      log.info("Searching books by author: {}", author);

      return restClient.get()
          .uri(url)
          .retrieve()
          .body(OpenLibrarySearchResponse.class);

    } catch (RestClientException e) {
      log.error("Error searching books by author: {}", e.getMessage());
      throw new ExternalApiException("Failed to search books by author", e);
    }
  }

  public OpenLibrarySearchResponse searchBySubject(String subject, Integer page, Integer limit) {
    try {
      int offset = (page != null && page > 0) ? (page - 1) * (limit != null ? limit : 10) : 0;
      int pageSize = limit != null ? limit : 10;

      String url = String.format("%s/search.json?subject=%s&offset=%d&limit=%d",
          baseUrl, subject, offset, pageSize);

      log.info("Searching books by subject: {}", subject);

      return restClient.get()
          .uri(url)
          .retrieve()
          .body(OpenLibrarySearchResponse.class);

    } catch (RestClientException e) {
      log.error("Error searching books by subject: {}", e.getMessage());
      throw new ExternalApiException("Failed to search books by subject", e);
    }
  }

  public OpenLibraryWorkResponse getWorkByKey(String workKey) {
    try {
      String url = String.format("%s%s.json", baseUrl, workKey);

      log.info("Fetching work details for key: {}", workKey);

      return restClient.get()
          .uri(url)
          .retrieve()
          .body(OpenLibraryWorkResponse.class);

    } catch (RestClientException e) {
      log.error("Error fetching work by key: {}", e.getMessage());
      throw new ExternalApiException("Failed to fetch work details", e);
    }
  }

  public OpenLibraryAuthorResponse getAuthorByKey(String authorKey) {
    try {
      String url = String.format("%s%s.json", baseUrl, authorKey);

      log.info("Fetching author details for key: {}", authorKey);

      return restClient.get()
          .uri(url)
          .retrieve()
          .body(OpenLibraryAuthorResponse.class);

    } catch (RestClientException e) {
      log.error("Error fetching author by key: {}", e.getMessage());
      throw new ExternalApiException("Failed to fetch author details", e);
    }
  }

  public OpenLibraryAuthorWorksResponse getAuthorWorks(String authorKey, Integer limit) {
    try {
      int pageSize = limit != null ? limit : 50;
      String url = String.format("%s%s/works.json?limit=%d", baseUrl, authorKey, pageSize);

      log.info("Fetching works for author key: {}", authorKey);

      return restClient.get()
          .uri(url)
          .retrieve()
          .body(OpenLibraryAuthorWorksResponse.class);

    } catch (RestClientException e) {
      log.error("Error fetching author works: {}", e.getMessage());
      throw new ExternalApiException("Failed to fetch author works", e);
    }
  }

  public String buildCoverUrl(Long coverId, String size) {
    if (coverId == null) {
      return null;
    }
    // S/M/L
    return String.format("%s/id/%d-%s.jpg", coversUrl, coverId, size != null ? size : "M");
  }

  public String buildAuthorPhotoUrl(Long photoId, String size) {
    if (photoId == null) {
      return null;
    }
    // S/M/L
    return String.format("https://covers.openlibrary.org/a/id/%d-%s.jpg", photoId, size != null ? size : "M");
  }
}
