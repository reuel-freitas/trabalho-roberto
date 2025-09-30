import { useEffect, useState } from "react";

interface JsonTransferInfo {
  client_id: string;
  timestamp: number;
  data_type: string;
  file_size: number;
  message: string;
}

function JsonTransferPanel() {
  const [jsonTransfers, setJsonTransfers] = useState<JsonTransferInfo[]>([]);

  useEffect(() => {
    // Simular dados de transferência JSON (em um cenário real, isso viria de uma API)
    const interval = setInterval(() => {
      // Simular recebimento de dados JSON do Client4
      const now = Date.now();
      const transfer: JsonTransferInfo = {
        client_id: "client4",
        timestamp: Math.floor(now / 1000),
        data_type: "sensor_data",
        file_size: 156,
        message: `JSON data received from Client4 at ${new Date(now).toLocaleTimeString()}`
      };
      
      setJsonTransfers(prev => [transfer, ...prev.slice(0, 9)]); // Manter últimos 10
    }, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      backgroundColor: "#F0F9FF", 
      border: "1px solid #0EA5E9", 
      borderRadius: "8px", 
      padding: "1rem",
      margin: "1rem 0"
    }}>
      <h3 style={{ margin: "0 0 1rem 0", color: "#0C4A6E" }}>
        📄 JSON Data Transfers via FTP
      </h3>
      
      {jsonTransfers.length === 0 ? (
        <p style={{ margin: 0, color: "#475569", fontStyle: "italic" }}>
          Waiting for JSON data transfers from Client4...
        </p>
      ) : (
        <div>
          <p style={{ margin: "0 0 1rem 0", color: "#0C4A6E", fontWeight: "bold" }}>
            Recent JSON Transfers ({jsonTransfers.length}):
          </p>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {jsonTransfers.map((transfer, index) => (
              <div 
                key={index}
                style={{ 
                  backgroundColor: "white", 
                  padding: "0.5rem", 
                  margin: "0.25rem 0", 
                  borderRadius: "4px",
                  border: "1px solid #E0F2FE"
                }}
              >
                <div style={{ fontSize: "0.875rem", color: "#0C4A6E" }}>
                  <strong>Client:</strong> {transfer.client_id} | 
                  <strong> Type:</strong> {transfer.data_type} | 
                  <strong> Size:</strong> {transfer.file_size} bytes
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "0.25rem" }}>
                  {transfer.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: "1rem", 
        padding: "0.5rem", 
        backgroundColor: "#E0F2FE", 
        borderRadius: "4px",
        fontSize: "0.875rem",
        color: "#0C4A6E"
      }}>
        <strong>How it works:</strong> Client4 creates JSON sensor data, uploads it via FTP to the backend, 
        and the backend processes it through the /api/json-data endpoint. The traffic is captured and 
        displayed in the charts above.
      </div>
    </div>
  );
}

export default JsonTransferPanel;
