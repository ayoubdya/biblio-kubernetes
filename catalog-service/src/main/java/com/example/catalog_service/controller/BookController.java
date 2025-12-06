package com.example.catalog_service.controller;

import com.example.catalog_service.model.Book;
import com.example.catalog_service.model.SearchResult;
import com.example.catalog_service.service.BookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

  private final BookService bookService;

  // GET /api/books/search?q=lord+of+the+rings&page=1&limit=10
  @GetMapping("/search")
  public ResponseEntity<SearchResult> searchBooks(
      @RequestParam("q") String query,
      @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
      @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit) {

    log.info("Search books endpoint called with query: {}, page: {}, limit: {}", query, page, limit);

    SearchResult result = bookService.searchBooks(query, page, limit);
    return ResponseEntity.ok(result);
  }

  // GET /api/books/search/title?title=lord+of+the+rings&page=1&limit=10
  @GetMapping("/search/title")
  public ResponseEntity<SearchResult> searchBooksByTitle(
      @RequestParam("title") String title,
      @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
      @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit) {

    log.info("Search by title endpoint called with title: {}", title);

    SearchResult result = bookService.searchBooksByTitle(title, page, limit);
    return ResponseEntity.ok(result);
  }

  // GET /api/books/search/author?author=tolkien&page=1&limit=10
  @GetMapping("/search/author")
  public ResponseEntity<SearchResult> searchBooksByAuthor(
      @RequestParam("author") String author,
      @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
      @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit) {

    log.info("Search by author endpoint called with author: {}", author);

    SearchResult result = bookService.searchBooksByAuthor(author, page, limit);
    return ResponseEntity.ok(result);
  }

  // GET /api/books/search/subject?subject=fantasy&page=1&limit=10
  @GetMapping("/search/subject")
  public ResponseEntity<SearchResult> searchBooksBySubject(
      @RequestParam("subject") String subject,
      @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
      @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit) {

    log.info("Search by subject endpoint called with subject: {}", subject);

    SearchResult result = bookService.searchBooksBySubject(subject, page, limit);
    return ResponseEntity.ok(result);
  }

  // GET /api/books/OL27448W
  @GetMapping("/{workKey}")
  public ResponseEntity<Book> getBookByKey(@PathVariable("workKey") String workKey) {
    log.info("Get book by key endpoint called with key: {}", workKey);

    Book book = bookService.getBookByKey(workKey);
    return ResponseEntity.ok(book);
  }

  // GET /api/books/health
  @GetMapping("/health")
  public ResponseEntity<String> health() {
    return ResponseEntity.ok("Book service is running");
  }
}
