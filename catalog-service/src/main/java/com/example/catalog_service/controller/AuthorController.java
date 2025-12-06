package com.example.catalog_service.controller;

import com.example.catalog_service.model.Author;
import com.example.catalog_service.service.AuthorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {

  private final AuthorService authorService;

  // GET /api/authors/OL23919A
  @GetMapping("/{authorKey}")
  public ResponseEntity<Author> getAuthorByKey(@PathVariable("authorKey") String authorKey) {
    log.info("Get author by key endpoint called with key: {}", authorKey);

    Author author = authorService.getAuthorByKey(authorKey);
    return ResponseEntity.ok(author);
  }

  // GET /api/authors/OL23919A/works?limit=10
  @GetMapping("/{authorKey}/works")
  public ResponseEntity<Author> getAuthorWithWorks(
      @PathVariable("authorKey") String authorKey,
      @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit) {

    log.info("Get author with works endpoint called with key: {} and limit: {}", authorKey, limit);

    Author author = authorService.getAuthorWithWorks(authorKey, limit);
    return ResponseEntity.ok(author);
  }

  // GET /api/authors/health
  @GetMapping("/health")
  public ResponseEntity<String> health() {
    return ResponseEntity.ok("Author service is running");
  }
}
