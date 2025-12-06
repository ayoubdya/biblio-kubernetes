package com.example.catalog_service.service;

import com.example.catalog_service.client.OpenLibraryClient;
import com.example.catalog_service.dto.*;
import com.example.catalog_service.exception.ResourceNotFoundException;
import com.example.catalog_service.model.Book;
import com.example.catalog_service.model.SearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {

  private final OpenLibraryClient openLibraryClient;

  public SearchResult searchBooks(String query, Integer page, Integer limit) {
    log.info("Searching books with query: {}", query);

    OpenLibrarySearchResponse response = openLibraryClient.searchBooks(query, page, limit);

    return mapToSearchResult(response);
  }

  public SearchResult searchBooksByTitle(String title, Integer page, Integer limit) {
    log.info("Searching books by title: {}", title);

    OpenLibrarySearchResponse response = openLibraryClient.searchByTitle(title, page, limit);

    return mapToSearchResult(response);
  }

  public SearchResult searchBooksByAuthor(String author, Integer page, Integer limit) {
    log.info("Searching books by author: {}", author);

    OpenLibrarySearchResponse response = openLibraryClient.searchByAuthor(author, page, limit);

    return mapToSearchResult(response);
  }

  public SearchResult searchBooksBySubject(String subject, Integer page, Integer limit) {
    log.info("Searching books by subject: {}", subject);

    OpenLibrarySearchResponse response = openLibraryClient.searchBySubject(subject, page, limit);

    return mapToSearchResult(response);
  }

  public Book getBookByKey(String workKey) {
    log.info("Fetching book details for key: {}", workKey);

    String normalizedKey = workKey.startsWith("/works/") ? workKey : "/works/" + workKey;

    OpenLibraryWorkResponse workResponse = openLibraryClient.getWorkByKey(normalizedKey);

    if (workResponse == null) {
      throw new ResourceNotFoundException("Work with key " + workKey + " not found");
    }

    return mapWorkToBook(workResponse);
  }

  private SearchResult mapToSearchResult(OpenLibrarySearchResponse response) {
    if (response == null) {
      return SearchResult.builder()
          .numFound(0)
          .start(0)
          .books(new ArrayList<>())
          .build();
    }

    List<Book> books = response.getDocs() != null
        ? response.getDocs().stream()
            .map(this::mapToBook)
            .collect(Collectors.toList())
        : new ArrayList<>();

    return SearchResult.builder()
        .numFound(response.getNumFound())
        .start(response.getStart())
        .books(books)
        .build();
  }

  private Book mapToBook(OpenLibraryDoc doc) {
    String coverUrl = doc.getCoverId() != null
        ? openLibraryClient.buildCoverUrl(doc.getCoverId(), "M")
        : null;

    String isbn = doc.getIsbn() != null && !doc.getIsbn().isEmpty()
        ? doc.getIsbn().get(0)
        : null;

    String language = doc.getLanguage() != null && !doc.getLanguage().isEmpty()
        ? doc.getLanguage().get(0)
        : null;

    return Book.builder()
        .key(doc.getKey())
        .title(doc.getTitle())
        .authors(doc.getAuthorName())
        .isbn(isbn)
        .firstPublishYear(doc.getFirstPublishYear())
        .numberOfPages(doc.getNumberOfPagesMedian())
        .subjects(doc.getSubject())
        .coverUrl(coverUrl)
        .publishers(doc.getPublisher())
        .averageRating(doc.getRatingsAverage())
        .language(language)
        .build();
  }

  private Book mapWorkToBook(OpenLibraryWorkResponse work) {
    String description = extractDescription(work.getDescription());

    String coverUrl = work.getCovers() != null && !work.getCovers().isEmpty()
        ? openLibraryClient.buildCoverUrl(work.getCovers().get(0), "M")
        : null;

    List<String> authorKeys = work.getAuthors() != null
        ? work.getAuthors().stream()
            .map(ref -> ref.getAuthor().getKey())
            .collect(Collectors.toList())
        : new ArrayList<>();

    return Book.builder()
        .key(work.getKey())
        .title(work.getTitle())
        .description(description)
        .coverUrl(coverUrl)
        .subjects(work.getSubjects())
        .authors(authorKeys)
        .build();
  }

  private String extractDescription(Object description) {
    if (description == null) {
      return null;
    }

    if (description instanceof String) {
      return (String) description;
    }

    if (description instanceof java.util.Map) {
      @SuppressWarnings("unchecked")
      java.util.Map<String, Object> descMap = (java.util.Map<String, Object>) description;
      Object value = descMap.get("value");
      return value != null ? value.toString() : null;
    }

    return description.toString();
  }
}
