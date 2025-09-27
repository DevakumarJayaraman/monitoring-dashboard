# React Frontend Quick Context

## Stack
- React 18 + Vite + TypeScript  
- Tailwind CSS  
- React Router v6  
- Context API (or Redux if needed)  
- React Hook Form for forms  

---

## Rules
- Functional components + hooks only  
- File naming: Components → PascalCase, hooks → useX, files → kebab-case  
- Always type props & API responses  
- Use async/await with try/catch for API calls  
- Keep Tailwind classes clean, extract repeated styles
- reuse components  

---

## Patterns

### Theme Context
```tsx
const ThemeContext = createContext({ theme: "light", toggle: () => {} });
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === "light" ? "dark" : "light") }}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};

# Data Format

ServiceInstances = [
  {
    "id": "svc-3001",
    "serviceName": "payment-service",
    "machineName": "apacqa-vm1",
    "Port": 8080,
    "infraType": "linux",
    "profile": "apacqa",
    "uptime": 14400,
    "version": "1.2.3",
    "logURL": "https://logs.example.com/apacqa/payment-service",
    "metricsURL": "https://metrics.example.com/apacqa/payment-service"
  },
  {
    "id": "svc-3002",
    "serviceName": "payment-service",
    "machineName": "apacqa-vm2",
    "Port": 8080,
    "infraType": "linux",
    "profile": "apacqa",
    "uptime": 12600,
    "version": "1.2.3",
    "logURL": "https://logs.example.com/apacqa/payment-service",
    "metricsURL": "https://metrics.example.com/apacqa/payment-service"
  },
  {
    "id": "svc-3003",
    "serviceName": "payment-service",
    "machineName": "apacuat-vm1",
    "Port": 8080,
    "infraType": "linux",
    "profile": "apacuat",
    "uptime": 28800,
    "version": "1.2.3",
    "logURL": "https://logs.example.com/apacuat/payment-service",
    "metricsURL": "https://metrics.example.com/apacuat/payment-service"
  }
]

InfraDetails = [
  {
    "id": "apacqa-vm1",
    "machineName": "apacqa-vm1",
    "region": "APAC",
    "environment": "UAT",
    "datacenter": "ap-southeast-1a",
    "sericesInstances": ["svc-3001"],
    "metrics": {
      "cpu": { "usage": 2.4, "limit": 4, "unit": "vCPU" },
      "memory": { "usage": 8.1, "limit": 16, "unit": "GiB" }
    }
  },
  {
    "id": "apacqa-vm2",
    "machineName": "apacqa-vm2",
    "region": "APAC",
    "environment": "UAT",
    "datacenter": "ap-southeast-1b",
    "sericesInstances": ["svc-3002"],
    "metrics": {
      "cpu": { "usage": 2.6, "limit": 4, "unit": "vCPU" },
      "memory": { "usage": 8.4, "limit": 16, "unit": "GiB" }
    }
  },
  {
    "id": "apacuat-vm1",
    "machineName": "apacuat-vm1",
    "region": "APAC",
    "environment": "UAT",
    "datacenter": "ap-southeast-1a",
    "sericesInstances": ["svc-3003"],
    "metrics": {
      "cpu": { "usage": 1.8, "limit": 4, "unit": "vCPU" },
      "memory": { "usage": 6.2, "limit": 16, "unit": "GiB" }
    }
  }
]
