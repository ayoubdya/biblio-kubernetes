package com.biblio.commentservice.repository;

import com.biblio.commentservice.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

  Page<Comment> findByBookKeyOrderByCreatedAtDesc(String bookKey, Pageable pageable);

  List<Comment> findByBookKeyOrderByCreatedAtDesc(String bookKey);

  Page<Comment> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

  Optional<Comment> findByBookKeyAndUserId(String bookKey, String userId);

  boolean existsByBookKeyAndUserId(String bookKey, String userId);

  long countByBookKey(String bookKey);

  @Query("SELECT AVG(c.rating) FROM Comment c WHERE c.bookKey = :bookKey")
  Double findAverageRatingByBookKey(@Param("bookKey") String bookKey);

  @Query("SELECT c.rating, COUNT(c) FROM Comment c WHERE c.bookKey = :bookKey GROUP BY c.rating")
  List<Object[]> countByBookKeyGroupByRating(@Param("bookKey") String bookKey);

  void deleteByBookKey(String bookKey);

  void deleteByUserId(String userId);
}
