const sql = require('mssql'); // ------------------------------------ Import the 'mssql' library for database interactions
const dbConfig = require('../dbConfig'); // ------------------------- Import database configuration

class Quiz { // ----------------------------------------------------- Define the Quiz class
    constructor(quiz_id, title, description, total_questions, total_marks, created_by, quizImg, creator_name = null) {
        this.quiz_id = quiz_id;
        this.title = title;
        this.description = description;
        this.total_questions = total_questions;
        this.total_marks = total_marks;
        this.created_by = created_by;
        this.quizImg = quizImg;
        if (creator_name) {
            this.creator_name = creator_name; // --------------------------------------------------- Assign the creator's name if provided
        }
    }

    // Method to create a new quiz
    static async createQuiz(newQuizData) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Establish database connection
            const sqlQuery = `
            INSERT INTO Quizzes (title, description, total_questions, total_marks, created_by, quizImg)
            VALUES (@inputTitle, @inputDescription, @inputTotal_questions, @inputTotal_marks, @inputCreated_by, @inputQuizImg);
            SELECT SCOPE_IDENTITY() AS quiz_id
            `; // ---------------------------------------------------------------------------------- SQL query to insert a new quiz and get the new quiz ID
            const request = connection.request(); // ----------------------------------------------- Create a request object for the query
            // ------------------------------------------------------------------------------------- Set input parameter
            request.input('inputTitle', newQuizData.title);
            request.input('inputDescription', newQuizData.description);
            request.input('inputTotal_questions', newQuizData.total_questions);
            request.input('inputTotal_marks', newQuizData.total_marks);
            request.input('inputCreated_by', newQuizData.created_by);
            request.input('inputQuizImg', sql.VarBinary, newQuizData.quizImg);
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.rowsAffected[0] === 0) { // ------------------------------------------------- Check if any rows were affected
                return null; // -------------------------------------------------------------------- Return null if no rows were affected
            }
            return await this.getQuizById(result.recordset[0].quiz_id); // ------------------------- Return the created quiz
        } catch (error) {
            console.error('Error creating quiz:', error); // --------------------------------------- Log error
            throw error; // ------------------------------------------------------------------------ Rethrow error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to get a quiz by ID
    static async getQuizById(quizId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT * FROM Quizzes WHERE quiz_id=@inputQuiz_id
            `; // ---------------------------------------------------------------------------------- SQL query to get a quiz by ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuiz_id', quizId); // ---------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ------------------------------------------------ Check if any records were returned
                return null;
            }
            const quiz = result.recordset[0]; // --------------------------------------------------- Get the quiz data
            return new Quiz(quizId , quiz.title, quiz.description, quiz.total_questions, quiz.total_marks, quiz.created_by, quiz.quizImg); // Return the quiz object
        } catch (error) {
            console.error('Error retrieving a single quiz:', error); // ---------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to get all quizzes with creator name
    static async getAllQuizWithCreatorName() {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT Quizzes.quiz_id, Quizzes.title, Quizzes.description, Quizzes.total_questions, Quizzes.total_marks, Quizzes.quizImg, Quizzes.created_by, Users.name AS 'creator_name' 
            FROM Quizzes INNER JOIN Users ON Quizzes.created_by = Users.id
            `; // ---------------------------------------------------------------------------------- SQL query to get all quizzes with creator names
            const request = connection.request(); // ----------------------------------------------- Create a new request
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ------------------------------------------------ Check if any records were returned
                return null;
            }
            //result.recordset.forEach(quiz => console.log(quiz.created_by));
            return result.recordset.map(quiz => 
                new Quiz(quiz.quiz_id, quiz.title, quiz.description, quiz.total_questions, 
                    quiz.total_marks, quiz.created_by, quiz.quizImg, quiz.creator_name)); // ------- Return an array of Quiz objects, not using getQuizById because this includes creator name
        } catch (error) {
            console.error('Error retrieving quizzes:', error); // ---------------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to update a quiz
    static async updateQuiz(quizId, newQuizData) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            UPDATE Quizzes 
            SET title=@inputTitle, description=@inputDescription, total_questions=@inputTotal_questions, 
            total_marks=@inputTotal_marks, quizImg=@inputQuizImg
            WHERE quiz_id=@inputQuiz_id;
            `; // ---------------------------------------------------------------------------------- SQL query to update a quiz
            const request = connection.request(); // ----------------------------------------------- Create a new request
            // ------------------------------------------------------------------------------------- Set input parameters
            request.input('inputTitle', newQuizData.title);
            request.input('inputDescription', newQuizData.description);
            request.input('inputTotal_questions', newQuizData.total_questions);
            request.input('inputTotal_marks', newQuizData.total_marks);
            request.input('inputCreated_by', newQuizData.created_by);
            request.input('inputQuizImg', sql.VarBinary, newQuizData.quizImg);
            request.input('inputQuiz_id', quizId);
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.rowsAffected[0] === 0) { // ------------------------------------------------- Check if any rows were affected
                return null;
            }
            return await this.getQuizById(quizId); // ---------------------------------------------- Return the updated quiz
        } catch (error) {
            console.error('Error updating a single quiz:', error); // ------------------------------ Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to delete a quiz
    static async deleteQuiz(quizId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM Quizzes WHERE quiz_id=@inputQuiz_id
            `; // ---------------------------------------------------------------------------------- SQL query to delete a quiz
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuiz_id', quizId); // ---------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.rowsAffected[0] === 0) { // ------------------------------------------------- Check if any rows were affected
                return null;
            }
            return result.rowsAffected[0] > 0; // -------------------------------------------------- Return true if any rows were deleted
        } catch (error) {
            console.error('Error updating a single quiz:', error); // ------------------------------ Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to get a quiz with its questions
    static async getQuizWithQuestions(quizId) { // so the question associated with the quiz will be shown when user clicks 'start quiz'
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT Quizzes.*, Questions.question_id, Questions.question_text, Questions.qnsImg, 
                   Questions.option_1, Questions.option_2, Questions.option_3, Questions.option_4, Questions.correct_option 
            FROM Quizzes 
            INNER JOIN Questions ON Quizzes.quiz_id = Questions.quiz_id 
            WHERE Quizzes.quiz_id = @inputQuiz_id
            `; // ---------------------------------------------------------------------------------- SQL query to get a quiz with its questions
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuiz_id', quizId); // ---------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query

            const quizQnsList = {}; // ------------------------------------------------------------- Initialize an empty object to store quizzes with questions
            for (const row of result.recordset) { // ----------------------------------------------- Loop through each row in the result set
                const quizId = row.quiz_id; // ----------------------------------------------------- Get the quiz ID
                const qnsId = row.question_id; // -------------------------------------------------- Get the question ID
                if (!quizQnsList[quizId]) { // ----------------------------------------------------- If the quiz is not already in the list, add it
                    quizQnsList[quizId] = {
                        quiz_id: row.quiz_id,
                        title: row.title,
                        description: row.description,
                        total_questions: row.total_questions,
                        total_marks: row.total_marks,
                        created_by: row.created_by,
                        quizImg: row.quizImg,
                        questions: []
                    };
                } 
                quizQnsList[quizId].questions.push({ // ------------------------------------------- Add the question to the quiz
                    question_id: qnsId,
                    question_text: row.question_text,
                    qnsImg: row.qnsImg,
                    option_1: row.option_1,
                    option_2: row.option_2,
                    option_3: row.option_3,
                    option_4: row.option_4,
                    correct_option: row.correct_option
                });
            }
            if (Object.keys(quizQnsList).length === 0) { // --------------------------------------- Check if any quizzes with questions were found
                return { message: "No quizzes with questions found" };
            }
            return Object.values(quizQnsList)[0]; // ---------------------------------------------- Return the first quiz with questions
        } catch (error) {
            console.error(error); // -------------------------------------------------------------- Log error
            throw new Error("Error fetching quiz with questions"); // ----------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // ----------------------------------- QUESTIONS -----------------------------------

    // Method to create a new question
    static async createQuestion(newQuestionData) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            INSERT INTO Questions 
            (quiz_id, question_text, qnsImg, option_1, option_2, option_3, option_4, correct_option) 
            VALUES (@quiz_id, @question_text, @qnsImg, @option_1, @option_2, @option_3, @option_4, @correct_option);
            SELECT SCOPE_IDENTITY() AS question_id
            `; // ---------------------------------------------------------------------------------- SQL query to insert a new question and get the new question ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            // ------------------------------------------------------------------------------------- Set input parameters
            request.input('quiz_id', newQuestionData.quiz_id);
            request.input('question_text', newQuestionData.question_text);
            request.input('qnsImg', sql.VarBinary, newQuestionData.qnsImg || null);
            request.input('option_1', newQuestionData.option_1);
            request.input('option_2',newQuestionData.option_2);
            request.input('option_3', newQuestionData.option_3);
            request.input('option_4', newQuestionData.option_4);
            request.input('correct_option', newQuestionData.correct_option);
    
            const result = await request.query(sqlQuery); // ------------------------------------- Execute the query
            if (result.rowsAffected[0] === 0) { // ----------------------------------------------- Check if any rows were affected
                console.log('No rows affected');
                return null;
            }
            return result.recordset[0].question_id; // ------------------------------------------- returning the created question_id
        } catch (error) {
            console.error('Error creating question:', error); // --------------------------------- Log error
            throw new Error("Error creating questions"); // -------------------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }  

    // Method to get a question by ID
    static async getQuestionById(qnsId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT * FROM Questions WHERE question_id=@inputQnsId
            `; // ---------------------------------------------------------------------------------- SQL query to get a question by ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQnsId', qnsId); // ------------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ------------------------------------------------ Check if any records were returned
                return null;
            }
            const questionData = result.recordset[0]; // ------------------------------------------- Get the question data

            // ------------------------------------------------------------------------------------- Returning structured object
            return {
                questionId: questionData.question_id,
                quizId: questionData.quiz_id,
                questionText: questionData.question_text,
                qnsImg: questionData.qnsImg,
                option1: questionData.option_1,
                option2: questionData.option_2,
                option3: questionData.option_3,
                option4: questionData.option_4,
                correctOption: questionData.correct_option
            };
        } catch (error) {
            console.error(error); // --------------------------------------------------------------- Log error
            throw new Error("Error fetching question by ID"); // ----------------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }      

    // Method to update a question
    static async updateQuestion(quizId, qnsId, newQuestionData) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            UPDATE Questions
            SET
                question_text = @question_text,
                qnsImg = @qnsImg,
                option_1 = @option_1,
                option_2 = @option_2,
                option_3 = @option_3,
                option_4 = @option_4,
                correct_option = @correct_option
            WHERE question_id = @question_id AND quiz_id = @quiz_id;
            `; // ----------------------------------------------------------------------------------- SQL query to update a question
            const request = connection.request(); // ------------------------------------------------ Create a new request
            // -------------------------------------------------------------------------------------- Set input parameters
            request.input('question_text', newQuestionData.question_text);
            request.input('qnsImg', sql.VarBinary, newQuestionData.qnsImg);
            request.input('option_1', newQuestionData.option_1);
            request.input('option_2', newQuestionData.option_2);
            request.input('option_3', newQuestionData.option_3);
            request.input('option_4', newQuestionData.option_4);
            request.input('correct_option', newQuestionData.correct_option);
            request.input('question_id', qnsId);
            request.input('quiz_id', quizId);
            const result = await request.query(sqlQuery); // ---------------------------------------- Execute the query
        
            if (result.rowsAffected[0] === 0) { // -------------------------------------------------- Check if any rows were affected
                return null;
            }
            return result.rowsAffected > 0; // ------------------------------------------------------ Return true if any rows were updated
        } catch (error) {
            console.error('Error updating question:', error); // ------------------------------------ Log error
            throw new Error("Error updating question"); // ------------------------------------------ Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }     
    
    // Method to delete questions by quiz ID
    static async deleteQuestionByQuizId(quizId){
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM Questions WHERE quiz_id=@inputQuizId
            `; // ---------------------------------------------------------------------------------- SQL query to delete questions by quiz ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuizId', quizId); // ----------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            return result.rowsAffected[0] > 0; // -------------------------------------------------- returns true if any rows were deleted
        } catch (error) {
            console.error('Error deleting question:', error); // ----------------------------------- Log error
            throw new Error("Error deleting question"); // ----------------------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }  

    // Method to delete a question by question ID
    static async deleteQuestionByQuestionId(qnsId){
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM Questions WHERE question_id=@inputQuestionId
            `; // ---------------------------------------------------------------------------------- SQL query to delete a question by question ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuestionId', qnsId); // -------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            return result.rowsAffected[0] > 0; // -------------------------------------------------- returns true if any rows were deleted
        } catch (error) {
            console.error('Error deleting question:', error); // ----------------------------------- Log error
            throw new Error("Error deleting question"); // ----------------------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }  

    // Method to delete user responses by question ID
    static async deleteUserResponsesByQuestionId(qnsId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try{
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM UserResponses WHERE question_id=@inputQuestionId
            `; // ---------------------------------------------------------------------------------- SQL query to delete user responses by question ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuestionId', qnsId); // -------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            // if (result.rowsAffected[0] === 0) {           IF NO RESPONSE DONT NEED TO RETURN NULL SINCE WE JUST WANT TO GET RID OF IT
            //     return null;
            // }
            return result.rowsAffected[0] > 0; // -------------------------------------------------- Return true if any rows were deleted
        } catch (error) {
            console.error('Error deleting user response by question ID:', error); // --------------- Log error
            throw new Error("Error deleting user response"); // ------------------------------------ Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to delete incorrect answers by question ID
    static async deleteIncorrectAnswersByQuestionId(qnsId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try{
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM IncorrectAnswers WHERE question_id=@inputQuestionId
            `; // ---------------------------------------------------------------------------------- SQL query to delete incorrect answers by question ID
            const request = connection.request();  // ---------------------------------------------- Create a new request
            request.input('inputQuestionId', qnsId); // -------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            // if (result.rowsAffected[0] === 0) {                 SAME FOR THIS ^^^
            //     return null;
            // }
            return result.rowsAffected[0] > 0; // -------------------------------------------------- Return true if any rows were deleted
        } catch (error) {
            console.error('Error deleting incorrect answer by question ID:', error); // ------------ Log error
            throw new Error("Error deleting incorrect answer"); // --------------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }


        
    // ----------------------------------- START OF MY CODE FOR USER QUIZ RESULTS RELATED -----------------------------------

    // Method to get all quiz results for a user
    static async getAllQuizResultsForUser(userId) { // TO BE DISPLAYED ON ACCOUNT PAGE 
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT U.attempt_id AS AttemptID, U.user_id AS UserID, U.attempt_date AS AttemptDate, U.score AS Score,
            U.time_taken AS TimeTaken, U.passed AS Passed, Q.title AS QuizTitle, Q.description AS QuizDescription,
            Q.total_questions AS TotalQuestions, Q.total_marks AS TotalMarks
            FROM UserQuizAttempts U 
            INNER JOIN Quizzes Q ON U.quiz_id = Q.quiz_id
            WHERE U.user_id = @inputUserId;
            `; // ---------------------------------------------------------------------------------- SQL query to get all quiz results for a user
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputUserId', userId); // ----------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ------------------------------------------------ Check if any records were returned
                return null;
            }
            return result.recordset; // ------------------------------------------------------------ Return the result set
        } catch (error) {
            console.error('Error fetching quiz results:', error); // ------------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // difference between above and below method is that 
    // top one retrieve 'quiz history'
    // bottom one retrieve the quiz result that was just attempted by user

    // Method to get a user's quiz result by attempt ID
    static async getUserQuizResult(userId, attemptId) { // ----------------------------------------- TO BE DISPLAYED AT THE END OF THE QUIZ
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT U.user_id AS UserID, U.attempt_date AS AttemptDate, U.score AS Score, 
                   U.time_taken AS TimeTaken, U.passed AS Passed, Q.title AS QuizTitle, Q.description AS QuizDescription, 
                   Q.total_marks AS TotalMarks, Q.total_questions AS TotalQuestions,
                   QR.question_id AS QuestionID, QR.selected_option AS SelectedOption, QNS.correct_option AS CorrectOption, 
                   QNS.question_text AS QuestionText, Users.name AS UserName
            FROM UserQuizAttempts U 
            INNER JOIN Quizzes Q ON U.quiz_id = Q.quiz_id
            INNER JOIN UserResponses QR ON U.attempt_id = QR.attempt_id
            INNER JOIN Questions QNS ON QR.question_id = QNS.question_id
            INNER JOIN Users ON U.user_id = Users.id
            WHERE U.user_id = @inputUserId AND U.attempt_id = @inputAttemptId;
            `; // --------------------------------------------------------------------------------- SQL query to get a user's quiz result by attempt ID

            const request = connection.request(); // ---------------------------------------------- Create a new request
            // ------------------------------------------------------------------------------------ Set input parameters
            request.input('inputUserId', userId);
            request.input('inputAttemptId', attemptId);

            const result = await request.query(sqlQuery); // -------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ----------------------------------------------- Check if any records were returned
                return null;
            }
            
            const attemptData = result.recordset[0]; // ------------------------------------------- Get the first record
            const userResponses = result.recordset.map(record => ({
                question_id: record.QuestionID,
                question_text: record.QuestionText,
                selected_option: record.SelectedOption,
                correct_option: record.CorrectOption
            })); // ------------------------------------------------------------------------------ Map the result set to user responses
                
            return {
                UserName: attemptData.UserName,
                AttemptDate: attemptData.AttemptDate,
                Score: attemptData.Score,
                TimeTaken: attemptData.TimeTaken,
                TotalQuestions: attemptData.TotalQuestions,
                TotalMarks: attemptData.TotalMarks,
                Passed: attemptData.Passed,
                QuizTitle: attemptData.QuizTitle,
                QuizDescription: attemptData.QuizDescription,
                UserResponses: userResponses
            }; // ------------------------------------------------------------------------------- Return a structured object
        } catch (error) {
            console.error(error); // ------------------------------------------------------------ Log error
            throw new Error("Error fetching user's quiz result"); // ---------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }    
   
    // Method to get the number of quiz attempts grouped by quiz ID
    static async getAttemptCountByQuizId(userId) { // ---------------------------------------------- show number of attempt to user // grouped by quiz id
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT COUNT(*) AS AttemptCount
            FROM UserQuizAttempts
            WHERE user_id = @userId
            GROUP BY quiz_id
            `; // ---------------------------------------------------------------------------------- SQL query to get the number of quiz attempts grouped by quiz ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('userId', userId); // ---------------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ------------------------------------------------ Check if any records were returned
                return null;
            }
            return result.recordset[0]; // --------------------------------------------------------- Return the result set
        } catch (error) {
            console.error(error); // --------------------------------------------------------------- Log error
            throw new Error("Error fetching quiz with questions"); // ------------------------------ Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to get the total number of quiz attempts for a user
    static async getAllAttemptCount(userId) { // --------------------------------------------------- show number of attempt to user
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT COUNT(*) AS AttemptCount
            FROM UserQuizAttempts
            WHERE user_id = @userId;
            `; // ---------------------------------------------------------------------------------- SQL query to get the total number of quiz attempts for a user
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('userId', userId); // ---------------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ------------------------------------------------ Check if any records were returned
                return null;
            }
            return result.recordset[0]; // --------------------------------------------------------- Return the result set
        } catch (error) {
            console.error(error); // --------------------------------------------------------------- Log error
            throw new Error("Error fetching quiz with questions"); // ------------------------------ Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to save user responses when the user submits the quiz
    static async saveUserResponse(attemptId, questionId, selectedOption) { // ---------------------- saves the options when user submits the quiz
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            INSERT INTO UserResponses (attempt_id, question_id, selected_option)
            VALUES (@attemptId, @questionId, @selectedOption)
            `; // ---------------------------------------------------------------------------------- SQL query to save user responses
            const request = connection.request(); // ----------------------------------------------- Create a new request
            // ------------------------------------------------------------------------------------- Set input parameters
            request.input('attemptId', attemptId)
            request.input('questionId', questionId)
            request.input('selectedOption', selectedOption);
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.rowsAffected[0] === 0) { // ------------------------------------------------- Check if any rows were affected
                return null;
            }
            return result.rowsAffected[0] > 0; // -------------------------------------------------- Return true if any rows were inserted
        } catch (error) {
            console.error('Error saving user response:', error); // -------------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }
    
    // Method to check if a given answer is correct
    static async isCorrectAnswer(questionId) { // -------------------------------------------------- when user submits the quiz, checks if the response === to the correct ans
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `                
            SELECT correct_option
            FROM Questions
            WHERE question_id = @questionId`
            ; // ----------------------------------------------------------------------------------- SQL query to get the correct answer for a question
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('questionId', questionId); // -------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            if (result.recordset.length === 0) { // ------------------------------------------------ Check if any records were returned
                return null;
            }
            return result.recordset[0].correct_option; // ------------------------------------------ Return the correct option
        } catch (error) {
            console.error('Error checking correct answer:', error); // ----------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }
    
    // Method to create a quiz attempt
    static async createQuizAttempt(userId, quizId, score, passed, timeTaken) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            INSERT INTO UserQuizAttempts
            (user_id, quiz_id, attempt_date, score, passed, time_taken)
            OUTPUT INSERTED.attempt_id
            VALUES (@userId, @quizId, GETDATE(), @score, @passed, @timeTaken)
            `; // ---------------------------------------------------------------------------------- SQL query to create a quiz attempt
            const request = connection.request(); // ----------------------------------------------- Create a new request
            // ------------------------------------------------------------------------------------- Set input parameters
            request.input('userId', userId);
            request.input('quizId', quizId);
            request.input('score', score);
            request.input('passed', passed);
            request.input('timeTaken', timeTaken);
            const result = await request.query(sqlQuery); // -------------------------------------- Execute the query
            return result.recordset[0].attempt_id; // --------------------------------------------- Return the attempt ID
        } catch (error) {
            console.error('Error creating quiz attempt:', error); // ------------------------------ Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to update a quiz attempt
    static async updateQuizAttempt(attemptId, score, passed) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            UPDATE UserQuizAttempts
            SET score = @score, passed = @passed
            WHERE attempt_id = @attemptId
            `; // ---------------------------------------------------------------------------------- SQL query to update a quiz attempt
            const request = connection.request(); // ----------------------------------------------- Create a new request
             // ------------------------------------------------------------------------------------ Set input parameters
            request.input('attemptId', attemptId);
            request.input('score', score);
            request.input('passed', passed);
            await request.query(sqlQuery); // ------------------------------------------------------ Execute the query
        } catch (error) {
            console.error('Error updating quiz attempt:', error); // ------------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to delete user attempts by quiz ID
    static async deleteUserAttempts (quizId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM UserQuizAttempts WHERE quiz_id=@inputQuizId
            `; // ---------------------------------------------------------------------------------- SQL query to delete user attempts by quiz ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuizId', quizId); // ----------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            // if (result.rowsAffected[0] === 0){
            //     return null;
            // }
            return result.rowsAffected[0] > 0; // ------------------------------------------------- Return true if any rows were deleted
        } catch (error) {
            console.error('Error deleting user quiz attempts:', error); // ------------------------ Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to delete user responses by quiz ID
    static async deleteUserResponsesByQuizId (quizId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM UserResponses
            WHERE question_id IN (SELECT question_id FROM Questions WHERE quiz_id = @inputQuizId)            
            `; // ---------------------------------------------------------------------------------- SQL query to delete user responses by quiz ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuizId', quizId); // ----------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            // if (result.rowsAffected[0] === 0){
            //     return null;
            // }
            return result.rowsAffected[0] > 0; // ------------------------------------------------- returns true
        } catch (error) {
            console.error('Error deleting user response:', error); // ----------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Method to delete incorrect answers by quiz ID
    static async deleteIncorrectAnswersByQuizId (quizId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            DELETE FROM IncorrectAnswers
            WHERE question_id IN (SELECT question_id FROM Questions WHERE quiz_id = @inputQuizId)           
            `; // ---------------------------------------------------------------------------------- SQL query to delete incorrect answers by quiz ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('inputQuizId', quizId); // ----------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            // if (result.rowsAffected[0] === 0){
            //     return null;
            // }
            return result.rowsAffected[0] > 0;// -------------------------------------------------- Return true if any rows were deleted
        } catch (error) {
            console.error('Error deleting incorrect answers:', error); // ------------------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }


    // ---------------- save incorrect answer ----------------
    static async saveIncorrectAnswer(attemptId, questionId, selectedOption, correctOption) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            INSERT INTO IncorrectAnswers (attempt_id, question_id, selected_option, correct_option)
            VALUES (@inputAttemptId, @inputQuestionId, @inputSelectedOption, @inputCorrectOption)
            `; // ---------------------------------------------------------------------------------- SQL query to save incorrect answers
            const request = connection.request(); // ----------------------------------------------- Create a new request
            // ------------------------------------------------------------------------------------- Set input parameters
            request.input('inputAttemptId', attemptId);
            request.input('inputQuestionId', questionId);
            request.input('inputSelectedOption', selectedOption);
            request.input('inputCorrectOption', correctOption);
            // const result = await request.query(sqlQuery);
            // if (result.rowsAffected[0] === 0) {
            //     return null
            // } NO BECAUSE SOME TIMES PEOPLE GET FULL MARKS 
            await request.query(sqlQuery); // ----------------------------------------------------- Execute the query
        } catch (error) {
            console.error('Error saving incorrect answer:', error); // ---------------------------- Log error
            throw new Error("Error saving incorrect answer"); // ---------------------------------- Throw error
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // ------------------------- START OF: pass fail stats for statistics html (social impact) -------------------------
    static async getQuizPassFailStatistics() {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT Quizzes.quiz_id, Quizzes.title,
            (SELECT COUNT(*) FROM UserQuizAttempts WHERE quiz_id = Quizzes.quiz_id) AS TotalAttempts,
            (SELECT COUNT(*) FROM UserQuizAttempts WHERE quiz_id = Quizzes.quiz_id AND passed = 1) AS PassCount,
            (SELECT COUNT(*) FROM UserQuizAttempts WHERE quiz_id = Quizzes.quiz_id AND passed = 0) AS FailCount
            FROM Quizzes;
            `; // ----------------------------------------------------------------------------------- SQL query to get quiz pass/fail statistics
            const request = connection.request(); // ------------------------------------------------ Create a new request
            const result = await request.query(sqlQuery); // ---------------------------------------- Execute the query
            return result.recordset; // ------------------------------------------------------------- Return the result set
        } catch (error) {
            console.error('Error fetching pass/fail statistics:', error); // ------------------------ Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }
    // ------------------------- END OF: pass fail stats for statistics html (social impact) -------------------------




    // ------------------------- START OF: for updating of questions & score after lecturers delete questions from quiz -------------------------
    // Retrieve all quiz attempts for a specific quiz
    static async getAllQuizResultsByQuizId(quizId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT * FROM UserQuizAttempts WHERE quiz_id=@quizId
            `; // ---------------------------------------------------------------------------------- SQL query to get all quiz results by quiz ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('quizId', quizId); // ---------------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            return result.recordset; // ------------------------------------------------------------ Return the result set
        } catch (error) {
            console.error('Error fetching all quiz results for quiz:', error); // ------------------ Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // Retrieve user responses by attempt ID
    static async getUserResponsesByAttemptId(attemptId) {
        let connection; // ------------------------------------------------------------------------- Declare a variable for the database connection
        try {
            connection = await sql.connect(dbConfig); // ------------------------------------------- Connect to the database
            const sqlQuery = `
            SELECT * FROM UserResponses WHERE attempt_id=@attemptId
            `; // ---------------------------------------------------------------------------------- SQL query to get user responses by attempt ID
            const request = connection.request(); // ----------------------------------------------- Create a new request
            request.input('attemptId', attemptId); // ---------------------------------------------- Set input parameter
            const result = await request.query(sqlQuery); // --------------------------------------- Execute the query
            return result.recordset; // ------------------------------------------------------------ Return the result set
        } catch (error) {
            console.error('Error fetching user responses by attempt ID:', error); // -------------- Log error
            throw error;
        } finally {
            if (connection) {
                await connection.close(); // ------------------------------------------------------- Close the database connection if it was established
            }
        }
    }

    // ------------------------- END OF: for updating of questions & score after lecturers delete questions from quiz -------------------------







    
}

module.exports= Quiz;