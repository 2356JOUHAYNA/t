package com.example.student_management;

import com.example.student_management.Service.StudentService;
import com.example.student_management.controllers.StudentController;
import com.example.student_management.entity.Student;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Arrays;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentControllerTest {

    @Mock
    private StudentService studentService;

    @InjectMocks
    private StudentController studentController;

    @BeforeEach
    void setup() {
        // rien de spécial, MockitoExtension gère l'init
    }

    @Test
    void testSaveStudent() {
        Student student = new Student();
        student.setId(1);
        student.setNom("Mido");

        Mockito.when(studentService.save(ArgumentMatchers.any(Student.class))).thenReturn(student);

        ResponseEntity<Student> response = studentController.save(student);

        Assertions.assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Assertions.assertEquals("Mido", response.getBody().getNom());
    }

    @Test
    void testDeleteStudent() {
        Mockito.when(studentService.delete(1)).thenReturn(true);

        ResponseEntity<Void> response = studentController.delete(1);

        Assertions.assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    void testFindAllStudents() {
        Student student1 = new Student();
        Student student2 = new Student();
        Mockito.when(studentService.findAll()).thenReturn(Arrays.asList(student1, student2));

        ResponseEntity<List<Student>> response = studentController.findAll();

        Assertions.assertEquals(2, response.getBody().size());
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testCountStudents() {
        Mockito.when(studentService.countStudents()).thenReturn(10L);

        ResponseEntity<Long> response = studentController.countStudent();

        Assertions.assertEquals(10L, response.getBody());
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testFindByYear() {
        Mockito.when(studentService.findNbrStudentByYear()).thenReturn(Arrays.asList());

        ResponseEntity<Collection<?>> response = studentController.findByYear();

        Assertions.assertEquals(0, response.getBody().size());
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}