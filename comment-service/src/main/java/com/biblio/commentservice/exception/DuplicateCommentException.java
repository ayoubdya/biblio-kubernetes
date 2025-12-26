package com.biblio.commentservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateCommentException extends RuntimeException {

  public DuplicateCommentException(String bookKey, String userId) {
    super("User " + userId + " has already commented on book: " + bookKey);
  }
}
