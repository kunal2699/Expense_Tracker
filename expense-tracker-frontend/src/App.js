import './App.css';
import React, { useState, useEffect, useContext , useCallback} from 'react';
import axios from 'axios';
import { AuthContext, AuthProvider } from './AuthContext';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import './Auth.css';

const categoriesColors = {
  Food: '#8884d8',
  Transport: '#82ca9d',
  Entertainment: '#ffc658',
  Utilities: '#ff8042',
  Other: '#8dd1e1',
};

function LoginRegister() {
  const { login } = useContext(AuthContext);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const url = `http://localhost:5000/${isRegister ? 'api/auth/register' : 'api/auth/login'}`;
      const res = await axios.post(url, form);
      if (!isRegister) {
        login(res.data.token, res.data.username);
      } else {
        alert('Registration successful! Please login.');
        setIsRegister(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-form-container">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <button
          className="auth-toggle-btn"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Have an account? Login' : 'No account? Register'}
        </button>
      </div>
    </div>
  );
}

function ExpenseTracker() {
  const { token, logout } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ amount: '', category: 'Food', date: '', description: '' });
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = useCallback(async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/expenses', {
            headers: { Authorization: `Bearer ${token}` },
        });
        setExpenses(res.data);
    } catch (error) {
        console.error(error);
        if (error.response?.status === 401) logout();
    }
}, [token, logout]);
  useEffect(() => {
    fetchExpenses();
}, [fetchExpenses]);



  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || !form.date) return alert('Amount and Date are required');

    try {
      if (editingExpense) {
        await axios.put(`http://localhost:5000/api/expenses/${editingExpense._id}`, {
          ...form,
          amount: parseFloat(form.amount),
          date: new Date(form.date),
        }, { headers: { Authorization: `Bearer ${token}` } });
        setEditingExpense(null);
      } else {
        await axios.post('http://localhost:5000/api/expenses', {
          ...form,
          amount: parseFloat(form.amount),
          date: new Date(form.date),
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setForm({ amount: '', category: 'Food', date: '', description: '' });
      fetchExpenses();
    } catch (error) {
      console.error(error);
      alert('Failed to save expense');
    }
  };

  const handleEdit = expense => {
    setEditingExpense(expense);
    setForm({
      amount: expense.amount,
      category: expense.category,
      date: expense.date.slice(0, 10),
      description: expense.description || '',
    });
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExpenses(expenses.filter(exp => exp._id !== id));
      } catch (error) {
        console.error(error);
        alert('Failed to delete expense');
      }
    }
  };

  // Aggregate data for charts (same as before)...
  const dataByCategory = Object.entries(
    expenses.reduce((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + cur.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const dataByDate = Object.entries(
    expenses.reduce((acc, cur) => {
      const dateStr = new Date(cur.date).toISOString().slice(0, 10);
      acc[dateStr] = (acc[dateStr] || 0) + cur.amount;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, amount]) => ({ date, amount }));

  return (
    <div className="expense-container">
    <h1>Expense Tracker</h1>
    <div className="user-bar">
      Logged in as <b>{ localStorage.getItem('username')}</b>
      <button onClick={logout}>Logout</button>
    </div>

    <form onSubmit={handleSubmit} className="expense-form">
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        value={form.amount}
        onChange={handleChange}
        required
        step="0.01"
      />
      <select name="category" value={form.category} onChange={handleChange}>
        {Object.keys(categoriesColors).map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input type="date" name="date" value={form.date} onChange={handleChange} required />
      <input
        type="text"
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      />
      <div className="form-buttons">
        <button type="submit">{editingExpense ? 'Update Expense' : 'Add Expense'}</button>
        {editingExpense && (
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setForm({ amount: '', category: 'Food', date: '', description: '' });
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>

    <h2>Expenses</h2>
    <ul className="expense-list">
      {expenses.map(exp => (
        <li key={exp._id} className="expense-item">
          <div>
            <strong>{new Date(exp.date).toLocaleDateString()}</strong> - {exp.category} - ${exp.amount.toFixed(2)}
            {exp.description && <em> - {exp.description}</em>}
          </div>
          <div className="actions">
            <button className="edit" onClick={() => handleEdit(exp)}>Edit</button>
            <button className="delete" onClick={() => handleDelete(exp._id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>

    <div className="charts-section">
      <div className="chart-box">
        <h2>Spending by Category</h2>
        {<PieChart width={400} height={300}>
        <Pie
          data={dataByCategory}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {dataByCategory.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={categoriesColors[entry.name] || '#ccc'} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>}
      </div>
      <div className="chart-box">
        <h2>Spending Over Time</h2>
        {<LineChart width={600} height={300} data={dataByDate}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="amount" stroke="#8884d8" />
      </LineChart>  }
      </div>
    </div>
  </div>
  );
}

function App() {
  const { token } = useContext(AuthContext);

  return token ? <ExpenseTracker /> : <LoginRegister />;
}

// Wrap App with AuthProvider in index.js or here
export default function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
