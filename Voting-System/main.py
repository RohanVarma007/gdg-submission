from tkinter import messagebox
import tkinter as tk
import mysql.connector as msql
import customtkinter as ctk
from tkinter import messagebox, StringVar, ttk
from PIL import Image, ImageTk

# Connect to the database
try:
    mycon = msql.connect(host="localhost", user="root", password="devi")
    if mycon.is_connected():
        print("Connection successful")
    else:
        print("Check connection again")
except Exception as e:
    print("Error connecting to database: {}".format(e))

mycur = mycon.cursor()

# Create the database and tables
try:
    mycur.execute("CREATE DATABASE devi_academy")
    print("Database created successfully.")
except:
    mycur.execute("DROP DATABASE devi_academy")
    mycur.execute("CREATE DATABASE devi_academy")

mycur.execute("USE devi_academy")

# Create student_info table
mycur.execute("""
CREATE TABLE IF NOT EXISTS student_info (
    stid INT PRIMARY KEY,
    pswd VARCHAR(255),
    name VARCHAR(50) NOT NULL,
    gender CHAR(1),
    class INT,
    section CHAR(1),
    age INT,
    dob VARCHAR(20),
    aadharno BIGINT UNIQUE NOT NULL,
    fathers_name VARCHAR(50),
    fathers_no BIGINT,
    mothers_name VARCHAR(50),
    mothers_no BIGINT,
    guardians_name VARCHAR(50),
    guardians_no BIGINT,
    blood_group VARCHAR(5),
    email VARCHAR(100),
    address VARCHAR(100),
    allergy VARCHAR(50),
    birthmark VARCHAR(50)
);
""")

# Create staff_info table
mycur.execute("""
CREATE TABLE IF NOT EXISTS staff_info (
    tid INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    subject VARCHAR(50),
    salary INT,
    gender CHAR(1),
    age INT,
    phone_no BIGINT,
    address VARCHAR(100),
    email VARCHAR(100),
    aadhar_no BIGINT
);
""")

# Create elections_results_2025 table
mycur.execute("""
CREATE TABLE IF NOT EXISTS elections_results_2025 ( stid INT PRIMARY KEY, head_boy VARCHAR(50), head_girl VARCHAR(50), cul_sec_boy VARCHAR(50), cul_sec_girl VARCHAR(50), sports_sec_boy VARCHAR(50), sports_sec_girl VARCHAR(50)
)
""")
# Create candidate tables
candidate_tables = ["head_boy_candidates", "head_girl_candidates", "cul_sec_boy_candidates",
                    "cul_sec_girl_candidates", "sports_sec_boy_candidates", "sports_sec_girl_candidates"]
for table in candidate_tables:
    mycur.execute("""
CREATE TABLE IF NOT EXISTS {} ( name VARCHAR(50), avgmarks FLOAT(20, 10), achievements VARCHAR(100)
)
""".format(table))
# Insert sample data into student_info
students = [
    (1, 'password1', 'Arun Kumar', 'M', 10, 'A', 15, '2009-05-12',
     123456789012, 'Ramesh', 9876543210, 'Lakshmi', 9876543211, 'Mani',
     9876543212, 'B+', 'arun.k@example.com', 'Chennai - 01', 'Dust', 'Mole'),
    (2, 'password2', 'Meena Devi', 'F', 9, 'B', 14, '2010-08-23',
     234567890123, 'Suresh', 9876543213, 'Radha', 9876543214, 'Ganesh',
     9876543215, 'O+', 'meena.d@example.com', 'Chennai - 02', 'Peanuts',
     'Scar'),
    (3, 'password3', 'Karthik Raja', 'M', 11, 'A', 16, '2008-04-15',
     345678901234, 'Rajesh', 9876543216, 'Revathi', 9876543217, 'Kannan',
     9876543218, 'A+', 'karthik.r@ex.com', 'Chennai - 03', 'Pollen',
     'Freckle'),
    (4, 'password4', 'Divya Rani', 'F', 10, 'C', 15, '2009-11-07',
     456789012345, 'Mahesh', 9876543219, 'Anitha', 9876543220, ' Ravi',
     9876543221, 'AB-', 'divya.r@ex.com', 'Chennai - 04', 'Seafood', 'Mole'),
    (5, 'password5', 'Vignesh Babu', 'M', 12, 'B', 17, '2007-01-20',
     567890123456, 'Srinivasan', 9876543222, 'Lakshmi', 9876543223, 'Kumar',
     9876543224, 'O-', 'vignesh.b@example.com', 'Chennai - 05', 'None',
     'Scar'),
    (6, 'password6', 'Lakshmi Priya', 'F', 9, 'A', 14, '2010-02-28',
     678901234567, 'Raghav', 9876543225, 'Sita', 9876543226, 'Vikram',
     9876543227, 'B+', 'lakshmi.p@example.com', 'Chennai - 06', 'None',
     'Freckle'),
    (7, 'password7', 'Ajay Varma', 'M', 11, 'B', 16, '2008-09-10',
     789012345678, 'Narasimhan', 9876543228, 'Geetha', 9876543229, 'Suresh',
     9876543230, 'A+', 'ajay.v@example.com', 'Chennai - 07', 'None', 'Mole'),
    (8, 'password8', 'Pavithra Devi', 'F', 10, 'C', 15, '2009-12-05',
     890123456789, 'Kumar', 9876543231, 'Anjali', 9876543232, 'Ravi',
     9876543233, 'O+', 'pavithra.d@example.com', 'Chennai - 08', 'None',
     'Scar'),
    (9, 'password9', 'Ravi Kiran', 'M', 12, 'A', 17, '2007-03-15',
     901234567890, 'Suresh', 9876543234, 'Lakshmi', 9876543235, 'Mani',
     9876543236, 'B-', 'ravi.k@example.com', 'Chennai - 09', 'None',
     'Freckle'),
    (10, 'password10', 'Nithya Shree', 'F', 9, 'B', 14, '2010-07-22',
     123456789013, 'Ramesh', 9876543237, 'Radha', 9876543238, 'Ganesh',
     9876543239, 'A-', 'nithya.s@example.com', 'Chennai - 10', 'None', 'Mole')
]
# Insert sample data into staff_info
staff = [
    (1, 'Mr. Sharma', 'Mathematics', 50000, 'M', 35, 9876543240,
     'Chennai - 11', 'sharma.m@example.com', 123456789012),
    (2, 'Ms. Gupta', 'Science', 55000, 'F', 30, 9876543241,
     'Chennai - 12', 'gupta.m@example.com', 234567890123),
    (3, 'Mr. Rao', 'English', 60000, 'M', 40, 9876543242,
     'Chennai - 13', 'rao.m@example.com', 345678901234),
    (4, 'Ms. Iyer', 'History', 52000, 'F', 28, 9876543243,
     'Chennai - 14', 'iyer.m@example.com', 456789012345),
    (5, 'Mr. Nair', 'Physical Education', 48000, 'M', 45,
     9876543244, 'Chennai - 15', 'nair.m@example.com', 567890123456),
    (6, 'Ms. Menon', 'Art', 47000, 'F', 32, 9876543245,
     'Chennai - 16', 'menon.m@example.com', 678901234567),
    (7, 'Mr. Pillai', 'Computer Science', 65000, 'M', 38, 9876543246,
     'Chennai - 17', 'pillai.m@example.com', 789012345678),
    (8, 'Ms. Reddy', 'Geography', 49000, 'F', 29, 9876543247,
     'Chennai - 18', 'reddy.m@example.com', 890123456789),
    (9, 'Mr. Verma', 'Music', 51000, 'M', 36, 9876543248,
     'Chennai - 19', 'verma.m@example.com', 901234567890),
    (10, 'Ms. Joshi', 'Dance', 48000, 'F', 31, 9876543249,
     'Chennai - 20', 'joshi.m@example.com', 123456789014)
]
# Insert sample data into elections_results_2025
election_results = [
    (1, 'Arun Kumar', 'Meena Devi', 'Ajay Varma',
     'Lakshmi Priya', 'Ravi Kiran', 'Pavithra Devi'),
    (2, 'Karthik Raja', 'Divya Rani', 'Vignesh Babu',
     'Nithya Shree', 'Ajay Varma', 'Meena Devi'),
    (3, 'Ravi Kiran', 'Lakshmi Priya', 'Ajay Varma',
     'Divya Rani', 'Karthik Raja', 'Pavithra Devi'),
    (4, 'Nithya Shree', 'Meena Devi', 'Vignesh Babu',
     'Pavithra Devi', 'Ravi Kiran', 'Lakshmi Priya'),
    (5, 'Ajay Varma', 'Divya Rani', 'Karthik Raja',
     'Nithya Shree', 'Arun Kumar', 'Meena Devi'),
    (6, 'Vignesh Babu', 'Lakshmi Priya', 'Ravi Kiran',
     'Pavithra Devi', 'Ajay Varma', 'Divya Rani'),
    (7, 'Arun Kumar', 'Meena Devi', 'Karthik Raja',
     'Nithya Shree', 'Vignesh Babu', 'Pavithra Devi'),
    (8, 'Ravi Kiran', 'Divya Rani', 'Ajay Varma',
     'Lakshmi Priya', 'Nithya Shree', 'Meena Devi'),
    (9, 'Karthik Raja', 'Pavithra Devi', 'Vignesh Babu',
     'Lakshmi Priya', 'Ravi Kiran', 'Divya Rani'),
    (10, 'Nithya Shree', 'Meena Devi', 'Ajay Varma',
     'Pavithra Devi', 'Arun Kumar', 'Karthik Raja')
]
# Inserting values into head_boy_candidates
mycur.execute("INSERT INTO head_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Arun Kumar', 85.5, 'Class Representative'))
mycur.execute("INSERT INTO head_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Karthik Raja', 90.0, 'Science Olympiad Winner'))
mycur.execute("INSERT INTO head_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Ajay Varma', 88.0, 'Debate Champion'))
mycur.execute("INSERT INTO head_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Vignesh Babu', 92.5, 'Sports Captain'))
mycur.execute("INSERT INTO head_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Ravi Kiran', 87.0, 'Cultural Fest Organizer'))
# Inserting values into head_girl_candidates
mycur.execute("INSERT INTO head_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Meena Devi', 89.0, 'Best Student Award'))
mycur.execute("INSERT INTO head_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Divya Rani', 91.5, 'Art Competition Winner'))
mycur.execute("INSERT INTO head_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Lakshmi Priya', 86.0, 'Drama Club President'))
mycur.execute("INSERT INTO head_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Pavithra Devi', 90.0, 'Literary Society Head'))
mycur.execute("INSERT INTO head_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Nithya Shree', 88.5, 'Environment Club Leader'))
# Inserting values into cul_sec_boy_candidates
mycur.execute("INSERT INTO cul_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Ajay Varma', 84.0, 'Best Actor in School Play'))
mycur.execute("INSERT INTO cul_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Karthik Raja', 87.5, 'Cultural Fest Coordinator'))
mycur.execute("INSERT INTO cul_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Arun Kumar', 85.0, 'Music Band Member'))
mycur.execute("INSERT INTO cul_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Vignesh Babu', 82.0, 'Dance Competition Winner'))
mycur.execute("INSERT INTO cul_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Ravi Kiran', 80.0, 'Art Exhibition Participant'))
# Inserting values into cul_sec_girl_candidates
mycur.execute("INSERT INTO cul_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Meena Devi', 90.0, 'Best Dancer Award'))
mycur.execute("INSERT INTO cul_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Divya Rani', 88.0, 'Art Club President'))
mycur.execute("INSERT INTO cul_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Lakshmi Priya', 85.5, 'Theater Group Leader'))
mycur.execute("INSERT INTO cul_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Pavithra Devi', 89.5, 'Cultural Fest Organizer'))
mycur.execute("INSERT INTO cul_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Nithya Shree', 87.0, 'Singing Competition Winner'))
# Inserting values into sports_sec_boy_candidates
mycur.execute("INSERT INTO sports_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Ajay Varma', 91.0, 'Football Team Captain'))
mycur.execute("INSERT INTO sports_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Karthik Raja', 89.0, 'Athletics Champion'))
mycur.execute("INSERT INTO sports_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Arun Kumar', 85.0, 'Basketball Team Member'))
mycur.execute("INSERT INTO sports_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Vignesh Babu', 90.5, 'Cricket Team Captain'))
mycur.execute("INSERT INTO sports_sec_boy_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Ravi Kiran', 88.0, 'Swimming Competition Winner'))
# Inserting values into sports_sec_girl_candidates
mycur.execute("INSERT INTO sports_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Meena Devi', 92.0, 'Basketball Team Captain'))
mycur.execute("INSERT INTO sports_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Divya Rani', 90.0, 'Athletics Champion'))
mycur.execute("INSERT INTO sports_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Lakshmi Priya', 88.5, 'Volleyball Team Member'))
mycur.execute("INSERT INTO sports_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Pavithra Devi', 91.5, 'Cricket Team Member'))
mycur.execute("INSERT INTO sports_sec_girl_candidates (name, avgmarks, achievements) VALUES (%s, %s, %s)",
              ('Nithya Shree', 89.0, 'Swimming Competition Winner'))
# Commit the changes to the database
mycon.commit()
# Insert data into student_info for student in students:
print("Successfully inserted sample candidates into all tables.")
mycur.execute("INSERT INTO student_info (stdid, pswd, name, gender, class, section, age, dob, aadharno, fathers_name, fathers_no, mothers_name, mothers_no, guardians_name, guardians_no, blood_group, email, address, allergy, birthmark) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", student)
# Insert data into staff_info for staff_member in staff:
mycur.execute("INSERT INTO staff_info (tid, name, subject, salary, gender, age, phone_no, address, email, aadhar_no) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", staff_member)
# Insert data into elections_results_2025 for result in election_results:
mycur.execute("INSERT INTO elections_results_2025 (stid, head_boy, head_girl, cul_sec_boy, cul_sec_girl, sports_sec_boy, sports_sec_girl) VALUES (%s, %s, %s, %s, %s, %s, %s)", result)
mycon.commit()  # Function to add a new student def add_student():
student_data = (int(input("Enter Student ID: ")), input("Enter Password: "), input("Enter Name: "), input("Enter Gender (M/F): "), int(input("Enter Class: ")), input("Enter Section: "), int(input("Enter Age: ")),
                input("Enter Date of Birth (YYYY-MM-DD): "), int(input("Enter Aadhar Number: ")
                                                                 ), input("Enter Father's Name: "), int(input("Enter Father's Phone Number: ")),
                input("Enter Mother's Name: "), int(
                    input("Enter Mother's Phone Number: ")),
                input("Enter Guardian's Name: "), int(
    input("Enter Guardian's Phone Number")),
    input("Enter Blood Group: "), input("Enter Email: "), input("Enter Address: "), input("Enter Allergy: "), input("Enter Birthmark: "))
mycur.execute("INSERT INTO student_info (stdid, pswd, name, gender, class, section, age, dob, aadharno, fathers_name, fathers_no, mothers_name, mothers_no, guardians_name, guardians_no, blood_group, email, address, allergy, birthmark) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", student_data)
mycon.commit()
print("Student added successfully.")
# Function to add a new staff member def add_staff():
staff_data = (int(input("Enter Staff ID: ")), input("Enter Name: "), input("Enter Subject: "), int(input("Enter Salary: ")), input("Enter Gender (M/F): "), int(input("Enter Age: ")), int(input("Enter Phone Number: ")), input("Enter Address: "), input("Enter Email: "),
              int(input("Enter Aadhar Number: "))
              )
mycur.execute("INSERT INTO staff_info (tid, name, subject, salary, gender, age, phone_no, address, email, aadhar_no) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", staff_data)
mycon.commit()
print("Staff member added successfully.")
# Function to add election results def add_election_result():
result_data = (int(input("Enter Student ID: ")), input("Enter Head Boy: "), input("Enter Head Girl: "), input("Enter Cultural Secretary Boy: "), input("Enter Cultural Secretary Girl: "), input("Enter Sports Secretary Boy: "), input("Enter Sports Secretary Girl: ")
               )


mycur.execute("INSERT INTO elections_results_2025 (stid, head_boy, head_girl, cul_sec_boy, cul_sec_girl, sports_sec_boy, sports_sec_girl) VALUES (%s, %s, %s, %s, %s, %s, %s)", result_data)
mycon.commit()
print("Election result added successfully.")
# Function to delete candidates


def del_candidates():
    a = input('Enter candidate name to be deleted: ')
    b = input("Enter the post which the candidate is contesting (head_boy, head_girl, cul_sec_boy, cul_sec_girl, sports_sec_boy, sports_sec_girl): ")

    # Check if the post is valid
    if b not in [table.split('_')[0] for table in candidate_tables]:
        print("Invalid post!")
        return

    # Construct the query to delete the candidate
    query = "DELETE FROM " + b + "_candidates WHERE name = %s"
    mycur.execute(query, (a,))
    mycon.commit()

    # Check if any rows were affected
    if mycur.rowcount > 0:
        print(f"Candidate {a} deleted from {b} candidates.")
    else:
        print(f"Candidate {a} not found in {b} candidates.")
# Function to view results


def see_results():
    # Query to get the vote counts for head boys
    query_head_boy = """
    SELECT head_boy AS candidate, COUNT(head_boy) AS votes
    FROM elections_results_2025
    GROUP BY head_boy
    """
    mycur.execute(query_head_boy)
    head_boy_results = mycur.fetchall()

    # Print the results for head boys
    print("\nVote Counts for Head Boys:")
    for candidate, votes in head_boy_results:
        print("{}: {} votes".format(candidate, votes))

    # Query to get the vote counts for head girls
    query_head_girl = """
    SELECT head_girl AS candidate, COUNT(head_girl) AS votes
    FROM elections_results_2025
    GROUP BY head_girl
    """
    mycur.execute(query_head_girl)
    head_girl_results = mycur.fetchall()

    # Print the results for head girls
    print("\nVote Counts for Head Girls:")
    for candidate, votes in head_girl_results:
        print("{}: {} votes".format(candidate, votes))

    # Query to get the vote counts for cultural secretary boys
    query_cul_sec_boy = """
    SELECT cul_sec_boy AS candidate, COUNT(cul_sec_boy) AS votes
    FROM elections_results_2025
    GROUP BY cul_sec_boy
    """
    mycur.execute(query_cul_sec_boy)
    cul_sec_boy_results = mycur.fetchall()

    # Print the results for cultural secretary boys
    print("\nVote Counts for Cultural Secretary Boys:")
    for candidate, votes in cul_sec_boy_results:
        print("{}: {} votes".format(candidate, votes))

    # Query to get the vote counts for cultural secretary girls
    query_cul_sec_girl = """
    SELECT cul_sec_girl AS candidate, COUNT(cul_sec_girl) AS votes
    FROM elections_results_2025
    GROUP BY cul_sec_girl
    """
    mycur.execute(query_cul_sec_girl)
    cul_sec_girl_results = mycur.fetchall()

    # Print the results for cultural secretary girls
    print("\nVote Counts for Cultural Secretary Girls:")
    for candidate, votes in cul_sec_girl_results:
        print("{}: {} votes".format(candidate, votes))
    # Query to get the vote counts for sports secretary boys
    query_sports_sec_boy = """
    SELECT sports_sec_boy AS candidate, COUNT(sports_sec_boy) AS votes
    FROM elections_results_2025
    GROUP BY sports_sec_boy
    """
    mycur.execute(query_sports_sec_boy)
    sports_sec_boy_results = mycur.fetchall()

    # Print the results for sports secretary boys
    print("\nVote Counts for Sports Secretary Boys:")
    for candidate, votes in sports_sec_boy_results:
        print("{}: {} votes".format(candidate, votes))

    # Query to get the vote counts for sports secretary girls
    query_sports_sec_girl = """
    SELECT sports_sec_girl AS candidate, COUNT(sports_sec_girl) AS votes
    FROM elections_results_2025
    GROUP BY sports_sec_girl
    """
    mycur.execute(query_sports_sec_girl)
    sports_sec_girl_results = mycur.fetchall()

    # Print the results for sports secretary girls
    print("\nVote Counts for Sports Secretary Girls:")
    for candidate, votes in sports_sec_girl_results:
        print("{}: {} votes".format(candidate, votes))


# Main program loop
while True:
    print('''Choose an option:
1. View Results
2. Delete Candidates
3. Add Student
4. Add Staff
5. Add Election Result
6. Exit''')
    choice = int(input("Enter your choice: "))

    if choice == 1:
        see_results()
    elif choice == 2:
        del_candidates()
    elif choice == 3:
        add_student()
    elif choice == 4:
        add_staff()
    elif choice == 5:
        add_election_result()
    elif choice == 6:
        break
    else:
        print("Invalid choice! Please try again.")

# Close the cursor and connection when done
mycon.commit()
mycur.close()
mycon.close()

# GUI Implementation


# Database connection
mycon = msql.connect(
    host="localhost",
    user="root",
    password="devi",
    database="devi_academy"
)
mycur = mycon.cursor()
# Function to authenticate student and save to candidate table


def authenticate_and_save():
    stdid = student_id_entry.get()
    password = password_entry.get()
    position = position_var.get()

    # Check if the student exists
    mycur.execute("SELECT pswd FROM student_info WHERE stdid = %s", (stdid,))
    result = mycur.fetchone()

    if result:
        if result[0] == password:
            # Determine the candidate table based on the position
            candidate_table = None
            if position == "Head Boy":
                candidate_table = "head_boy_candidates"
            elif position == "Head Girl":
                candidate_table = "head_girl_candidates"
            elif position == "Cultural Secretary - Boy":
                candidate_table = "cul_sec_boy_candidates"
            elif position == "Cultural Secretary - Girl":
                candidate_table = "cul_sec_girl_candidates"
            elif position == "Sports Secretary - Boy":
                candidate_table = "sports_sec_boy_candidates"
            elif position == "Sports Secretary - Girl":
                candidate_table = "sports_sec_girl_candidates"
            else:
                messagebox.showerror("Error", "Invalid position selected.")
                return
            # Save the student to the respective candidate table
            insert_query = "INSERT INTO {} (name, avgmarks, achievements) VALUES (%s, %s, %s)".format(
                candidate_table)
            mycur.execute(insert_query, (stdid, 0.0,
                          'Registered as candidate'))
            mycon.commit()
            messagebox.showinfo(
                "Success", "Student authenticated and registered as candidate!")
        else:
            messagebox.showerror("Login Error", "Incorrect password.")
    else:
        messagebox.showerror("Login Error", "Invalid Student ID.")


# Create main window
root = ctk.CTk()
root.title("Student Authentication")
root.geometry("800x600")  # Set initial window size

# Load background image using Pillow
# Load the JPEG image
bg_image = Image.open("C:/Users/HP/Downloads/drivewall2.jpg")

# Function to resize the image to fullscreen


def resize_image():
    width = root.winfo_width()
    height = root.winfo_height()
    # Resize the image to fit the window
    resized_image = bg_image.resize((width, height), Image.LANCZOS)
    # Convert to PhotoImage for CustomTkinter
    return ImageTk.PhotoImage(resized_image)


# Create a label to hold the background image
bg_label = ctk.CTkLabel(root)
bg_label.place(relwidth=1, relheight=1)

# Function to update the background image


def update_background():
    bg_label.configure(image=resize_image())
    bg_label.image = resize_image()  # Keep a reference to avoid garbage collection


# Update the background image when the window is resized
root.bind("<Configure>", lambda event: update_background())

# Create input fields
ctk.CTkLabel(root, text="Student ID:").pack(pady=10)
student_id_entry = ctk.CTkEntry(root)
student_id_entry.pack(pady=5)

ctk.CTkLabel(root, text="Password:").pack(pady=10)
password_entry = ctk.CTkEntry(root, show="*")
password_entry.pack(pady=5)
# Dropdown for position selection
ctk.CTkLabel(root, text="Position:").pack(pady=10)
position_var = StringVar()
position_dropdown = ttk.Combobox(root, textvariable=position_var)
position_dropdown['values'] = (
    "Head Boy",
    "Head Girl",
    "Cultural Secretary - Boy",
    "Cultural Secretary - Girl",
    "Sports Secretary - Boy",
    "Sports Secretary - Girl"
)
position_dropdown.pack(pady=5)

# Authenticate button
authenticate_button = ctk.CTkButton(
    root, text="Authenticate", command=authenticate_and_save)
authenticate_button.pack(pady=20)

# Start the application
root.mainloop()

# Second Window Implementation

# Database connection
mycon = msql.connect(
    host="localhost",
    user="root",
    password="devi",
    database="devi_academy"
)
mycur = mycon.cursor()

# Main login window
root = tk.Tk()
root.title("Devi Academy Election Login")
root.geometry("600x400")
root.configure(bg="#1b1b2f")
# Space theme colors and styles
entry_bg = "#3c3c47"
text_color = "#f5f5f5"
button_bg = "#2e2e38"
button_fg = "#00e0ff"
font_style = ("Courier", 16, "bold")

# Title label
title_label = tk.Label(
    root,
    text="Welcome to Devi Academy Elections",
    font=("Courier", 20, "bold"),
    fg="#ffcc00",
    bg="#1b1b2f"
)
title_label.pack(pady=20)

# Username and password labels and entries
username_label = tk.Label(
    root,
    text="Student ID:",
    font=font_style,
    fg=text_color,
    bg="#1b1b2f"
)
username_label.pack(pady=5)

username_entry = tk.Entry(
    root,
    font=font_style,
    bg=entry_bg,
    fg=text_color,
    width=20,
    justify='center'
)
username_entry.pack()

password_label = tk.Label(
    root,
    text="Password:",
    font=font_style,
    fg=text_color,
    bg="#1b1b2f"
)
password_label.pack(pady=5)

password_entry = tk.Entry(
    root,
    show="*",
    font=font_style,
    bg=entry_bg,
    fg=text_color,
    width=20,
    justify='center'
)
password_entry.pack()
# Function to show the voting page


def show_voting_page(stid):
    positions = {
        "Head Boy": "head_boy_candidates",
        "Head Girl": "head_girl_candidates",
        "Cultural Secretary - Boy": "cul_sec_boy_candidates",
        "Cultural Secretary - Girl": "cul_sec_girl_candidates",
        "Sports Secretary - Boy": "sports_sec_boy_candidates",
        "Sports Secretary - Girl": "sports_sec_girl_candidates"
    }

    # New window for voting
    vote_window = tk.Toplevel(root)
    vote_window.title("Vote for Candidates")
    vote_window.geometry("600x600")
    vote_window.configure(bg="#1b1b2f")

    # Label for voting
    vote_label = tk.Label(
        vote_window,
        text="Vote for Candidates",
        font=("Courier", 20, "bold"),
        fg="#ffcc00",
        bg="#1b1b2f"
    )
    vote_label.grid(row=0, column=0, columnspan=2, pady=20)

    # Dictionary to hold selected candidates
    selected_candidates = {}

    # Create dropdowns for each position
    for row, (position, candidate_table) in enumerate(positions.items(), start=1):
        # Label for each position
        position_label = tk.Label(
            vote_window,
            text=position,
            font=font_style,
            fg=text_color,
            bg="#1b1b2f"
        )
        position_label.grid(row=row, column=0, pady=5)

        # Candidate selection dropdown
        selected_candidate = tk.StringVar(vote_window)
        selected_candidate.set("Select a candidate")
        selected_candidates[position] = selected_candidate

        # Fetch candidates for the current position
        mycur.execute("SELECT name FROM {}".format(candidate_table))
        candidates = [row[0] for row in mycur.fetchall()]

        candidate_menu = tk.OptionMenu(
            vote_window, selected_candidate, *candidates)
        candidate_menu.config(font=font_style, bg=entry_bg, fg=text_color)
        candidate_menu.grid(row=row, column=1, pady=10)
    # Function to submit all votes

    def submit_votes():
        # Prepare a dictionary to hold the selected candidates
        votes = {
            "head_boy": None,
            "head_girl": None,
            "cul_sec_boy": None,
            "cul_sec_girl": None,
            "sports_sec_boy": None,
            "sports_sec_girl": None
        }

        # Collect votes from selected candidates
        for position, candidate_var in selected_candidates.items():
            candidate_name = candidate_var.get()
            if candidate_name and candidate_name != "Select a candidate":
                votes[position.lower().replace(' ', '_')] = candidate_name

        # Prepare the SQL query to insert or update the votes
        sql_query = """
        INSERT INTO elections_results_2025 (stid, head_boy, head_girl, cul_sec_boy, cul_sec_girl, sports_sec_boy, sports_sec_girl)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            head_boy = VALUES(head_boy),
            head_girl = VALUES(head_girl),
            cul_sec_boy = VALUES(cul_sec_boy),
            cul_sec_girl = VALUES(cul_sec_girl),
            sports_sec_boy = VALUES(sports_sec_boy),
            sports_sec_girl = VALUES(sports_sec_girl);
        """

        # Execute the query with the collected votes
        mycur.execute(sql_query, (
            stid,
            votes['head_boy'],
            votes['head_girl'],
            votes['cul_sec_boy'],
            votes['cul_sec_girl'],
            votes['sports_sec_boy'],
            votes['sports_sec_girl']
        ))
        mycon.commit()  # Commit the changes to the database
        vote_window.destroy()  # Close voting window
        messagebox.showinfo("Complete", "Voting completed!")
    # Submit button for votes
    submit_button = tk.Button(
        vote_window,
        text="Submit Votes",
        font=font_style,
        bg=button_bg,
        fg=button_fg,
        command=submit_votes
    )
    submit_button.grid(row=len(positions) + 1, column=1,
                       sticky=tk.E, padx=20, pady=20)  # Align to the right
    mycon.commit()

# Function to check login credentials


def check_login():
    stdid = username_entry.get()
    password = password_entry.get()
    mycur.execute("SELECT pswd FROM student_info WHERE stdid = %s",
                  (stdid,))
    result = mycur.fetchone()
    if result:
        if result[0] == password:
            root.withdraw()  # Hide the login window instead of destroying it
            show_voting_page(stdid)  # Start voting
        else:
            messagebox.showerror("Login Error", "Incorrect password.")
    else:
        messagebox.showerror("Login Error", "Invalid Student ID.")


# Login button
login_button = tk.Button(
    root,
    text="Login",
    font=font_style,
    bg=button_bg,
    fg=button_fg,
    command=check_login
)
login_button.pack(pady=20)

# Start the application
root.mainloop()
