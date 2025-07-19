# Mini Social Network Feed Using Trees and Graphs

A *mini social networking platform* focusing on *relationship management and content distribution* using *graph structures, tree-based comments, and feed ranking algorithms*.

---

## 🚀 Features

✅ User Relationship Mapping using Graphs  
✅ Hierarchical Comment System using Trees  
✅ Friend Suggestion Algorithms (BFS, MST)  
✅ Community Detection using DFS  
✅ Personalized, Ranked Feed Generation using Priority Queues  
✅ Timeline Organization using Topological Sorting  
✅ React Frontend + Express Backend + MongoDB

---

## 🛠 Tech Stack

- *Frontend:* React.js
- *Backend:* Node.js + Express.js
- *Database:* MongoDB (via Mongoose)
- *API Calls:* Axios / Fetch

---

## 🧩 Data Structures

- *Graphs:* Represent user relationships (nodes = users, edges = friendships)
- *Trees:* Organize hierarchical comments under posts
- *Priority Queues:* Rank feeds based on likes, comments, and recency
- *Hash Maps:* Quick user profile and post retrieval

---

## ⚙ Algorithms

- *Breadth-First Search (BFS):* Friend suggestions, shortest paths
- *Depth-First Search (DFS):* Community detection
- *Minimum Spanning Tree (MST):* Optimal connection suggestions
- *Topological Sorting:* Timeline organization
- *Shortest Path:* Mutual friend discovery

---

## 📦 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ManikantaChapala/Mini-Social-Network.git
cd Mini-Social-Network
2️⃣ Backend Setup
bash
Copy
Edit
cd backend
npm install
Create a .env file inside the backend folder:

ini
Copy
Edit
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
Run the backend server:

bash
Copy
Edit
npm start
3️⃣ Frontend Setup
Open a new terminal, then:

bash
Copy
Edit
cd frontend
npm install
Run the React development server:

bash
Copy
Edit
npm start
The frontend will be available at:

arduino
Copy
Edit
http://localhost:3000
🚀 Usage
Register and log in.

Add and manage friends.

Create posts and comment hierarchically.

Receive ranked, personalized feeds based on your network and interactions.

Explore community detection and friend suggestions.

🚀 Future Enhancements

Graph visualization for user networks.

Deployment on Vercel/Render/AWS.

🤝 Contributing
Fork this repository.

Create your feature branch (git checkout -b feature/YourFeature).

Commit your changes (git commit -m 'Add Your Feature').

Push to your branch (git push origin feature/YourFeature).

Open a Pull Request.

