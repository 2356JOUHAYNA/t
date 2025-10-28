package com.example.student_management.repository;


import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.student_management.entity.Student;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {

    // Recherche d'un étudiant par son identifiant
    Student findById(int id);

    // Requête personnalisée pour compter les étudiants par année de naissance
    @Query("SELECT YEAR(s.dateNaissance), COUNT(s) FROM Student s GROUP BY YEAR(s.dateNaissance)")
    Collection<Object[]> findNbrStudentByYear();
}