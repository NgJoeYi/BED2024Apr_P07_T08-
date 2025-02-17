const sql = require('mssql');
const dbConfig = require('../dbConfig');
const { devNull } = require('os');

class Courses {
    constructor(courseID, userID, title, description, category, level, duration, createdAt, courseImage) {
        this.courseID = courseID;
        this.userID = userID;
        this.title = title;
        this.description = description;
        this.category = category;
        this.level = level;
        this.duration = duration;
        this.createdAt = createdAt;
        this.courseImage = courseImage;
    }
    // getting all courses in the table 
    static async getAllCourses() {
        let pool;
        try {
            pool = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM Courses`;
            const result = await pool.request().query(sqlQuery);
            return result.recordset.map(row => new Courses(row.CourseID, row.UserID, row.Title, row.Description, row.Category, row.Level, row.Duration, row.CreatedAt, row.CourseImage));
        } catch (error) {
            console.error('Error retrieving courses:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    // getting specific course by id 
    static async getCourseById(id) {
        let connection = await sql.connect(dbConfig);
        try {
            const sqlQuery = `SELECT * FROM Courses WHERE CourseID = @id`;
            const request = connection.request();
            request.input('id', sql.Int, id);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            const courseData = result.recordset[0];
            return new Courses(
                courseData.CourseID, 
                courseData.UserID, 
                courseData.Title, 
                courseData.Description, 
                courseData.Category, 
                courseData.Level, 
                courseData.Duration, 
                courseData.CreatedAt, 
                courseData.CourseImage
            );
        } catch (error) {
            console.error('Error retrieving course:', error);
            throw error;
        }finally{
            await connection.close();
        }
    }

    // getting all the categories for filtering by categories
    static async getAllCategories(){
        const connection = await sql.connect(dbConfig);
        try{
            const sqlQuery = `SELECT Category FROM Courses`;
            const result = await connection.request().query(sqlQuery);
            return result.recordset;
        }catch(error){
            console.error('Error retrieving categories of courses:', error);
            throw error;

        }finally{
            await connection.close();
        }
    }
    // for filtering  by category
    static async filterByCategory(category) {
        const connection = await sql.connect(dbConfig);
        try {
          const sqlQuery = `SELECT * FROM Courses WHERE Category = @category`;
          const request = await connection.request();
          request.input('category', sql.NVarChar, category);
          const result = await request.query(sqlQuery);
          return result.recordset;
        } catch (error) {
          console.error('Error retrieving courses by category:', error);
          throw error;
        } finally {
          await connection.close();
        }
    }      

    // for filtering by most recent on top
    static async getMostRecentCourses(){
        const connection = await sql.connect(dbConfig);
        try{
            const sqlQuery  = `select * from Courses ORDER BY CreatedAt ASC`
            const result = await connection.request().query(sqlQuery);
            return result.recordset;

        }catch(error){
            console.error('Error retrieving most recent courses', error);
            throw error;

        }finally{
            await connection.close();
        }
    }

       // for filtering by earliest on top 
       static async getEarliestCourses(){
        const connection = await sql.connect(dbConfig);
        try{
            const sqlQuery  = `select * from Courses ORDER BY CreatedAt DESC`
            const result = await connection.request().query(sqlQuery);
            return result.recordset;

        }catch(error){
            console.error('Error retrieving most earliest courses', error);
            throw error;

        }finally{
            await connection.close();
        }
    }

    // updating courses logic 
    static async updateCourse(id, newCourseData) {
        const connection = await sql.connect(dbConfig);
        try {
            const sqlQuery = `
                UPDATE Courses SET 
                    Title = @title, 
                    Description = @description,
                    Category = @category,
                    Level = @level,
                    Duration = @duration,
                    CourseImage = @courseImage 
                WHERE CourseID = @id
            `;
            const request = connection.request();
            request.input('id', sql.Int, id);
            request.input('title', sql.NVarChar, newCourseData.title);
            request.input('description', sql.NVarChar, newCourseData.description);
            request.input('category', sql.NVarChar, newCourseData.category);
            request.input('level', sql.NVarChar, newCourseData.level);
            request.input('duration', sql.Int, newCourseData.duration);
    
            // Check if the courseImage field exists and is a filename
            if (newCourseData.courseImage) {
                request.input('courseImage', sql.NVarChar, newCourseData.courseImage);
            } else {
                // If no new image is provided, use the existing image filename
                const existingCourse = await this.getCourseById(id);
                if (existingCourse) {
                    request.input('courseImage', sql.NVarChar, existingCourse.courseImage);
                } else {
                    request.input('courseImage', sql.Null, null);
                }
            }
        
            await request.query(sqlQuery);
            return await this.getCourseById(id);
        } catch (error) {
            console.error('Error updating course:', error);  // Log detailed error
            throw error;
        } finally {
            await connection.close();
        }
    }
    

    // deleting courses with no lectures logic so all courses will have lectures inside it 
    static async deleteCourseWithNoLectures() {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                DELETE FROM Courses
                WHERE CourseID NOT IN (SELECT DISTINCT CourseID FROM Lectures);
            `;
            const result = await connection.request().query(sqlQuery);
    
            // Check if rowsAffected is not undefined or null
            if (result && result.rowsAffected) {
                const rowsAffected = result.rowsAffected.reduce((acc, val) => acc + val, 0);
                console.log('Rows affected by delete operation:', rowsAffected); // Log rows affected
                return rowsAffected > 0;
            } else {
                console.log('No rows affected by delete operation.');
                return false;
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        } finally {
            if (connection) await connection.close();
        }
    }
    
    // delete course logic 
    static async deleteCourse(id) {
        let pool;
        try {
            pool = await sql.connect(dbConfig);
            const sqlQuery = `
            DELETE FROM Lectures WHERE CourseID = @id;
            DELETE FROM Courses WHERE CourseID = @id
            `;
            const request = pool.request();
            request.input('id', sql.Int, id);
            const result = await request.query(sqlQuery);
            const rowsAffected = result.rowsAffected.reduce((acc, val) => acc + val, 0);
            return rowsAffected > 0;
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    // create course logic 
    static async createCourse(newCourseData) {
        let pool;
        try {
            pool = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO Courses (UserID, Title, Description, Category, Level, Duration, CourseImage)
                VALUES (@UserID, @Title, @Description, @Category, @Level, @Duration, @CourseImage);
                SELECT SCOPE_IDENTITY() AS CourseID;
            `;
            const request = pool.request();
            request.input('UserID', sql.Int, newCourseData.UserID);
            request.input('Title', sql.NVarChar, newCourseData.title);
            request.input('Description', sql.NVarChar, newCourseData.description);
            request.input('Category', sql.NVarChar, newCourseData.category);
            request.input('Level', sql.NVarChar, newCourseData.level);
            request.input('Duration', sql.Int, newCourseData.duration);
            request.input('CourseImage', sql.NVarChar, newCourseData.CourseImage);

            const result = await request.query(sqlQuery);
            const newCourseID = result.recordset[0].CourseID;
            return newCourseID;
        } catch (error) {
            console.error('Error creating course:', error);
            throw error;
        } finally {
            if (pool) pool.close();
        }
    }

    
    // get course image for course.html course container 
    static async getCourseImage(id){
        const connection = await sql.connect(dbConfig);
        
        try{
            const sqlQuery = `SELECT CourseImage FROM Courses WHERE CourseID = @id`;
            const request = connection.request();
            request.input("id", sql.Int, id);
            const result = await request.query(sqlQuery);
            if (result.recordset.length === 0) {
                return null;
            }
            return result.recordset[0].CourseImage;
        }catch (error) {
            console.error('Error fetching course image:', error);
            throw error;
        } finally {
            await connection.close();
        }
          
    }

    // search course logic 
    static async searchCourses(searchTerm) {
        const connection = await sql.connect(dbConfig);
        try {
            const sqlQuery = `SELECT * FROM Courses WHERE Title LIKE @searchTerm`;
            const request = await connection.request();
            request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error('Error searching for courses:', error);
            throw error;
        } finally {
            await connection.close();
        }
    }

}
module.exports = Courses;
