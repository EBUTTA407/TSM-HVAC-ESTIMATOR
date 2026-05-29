import { useMemo, useState } from "react";
import "./App.css";

const repairTemplates = {
  "Custom": { labor: 2, misc: 35, notes: [] },
  "Condenser Fan Motor": {
    labor: 2.5,
    misc: 45,
    directDrive: true,
    notes: [
      "Replace capacitor with motor.",
      "Verify condenser fan blade condition.",
      "Check motor amps and rotation after replacement."
    ]
  },
  "Blower Motor": {
    labor: 3,
    misc: 45,
    directDrive: true,
    notes: [
      "Replace capacitor if applicable.",
      "Check blower wheel condition.",
      "Verify amp draw and airflow."
    ]
  },
  "ECM Motor": {
    labor: 3.5,
    misc: 55,
    notes: [
      "Verify module and motor compatibility.",
      "Check low voltage communication and motor programming."
    ]
  },
  "Compressor": {
    labor: 8,
    misc: 175,
    notes: [
      "Replace filter drier.",
      "Pressure test with nitrogen.",
      "Pull deep vacuum and recharge system.",
      "Check start components and electrical."
    ]
  },
  "Capacitor": {
    labor: 1,
    misc: 15,
    notes: [
      "Verify microfarad rating.",
      "Test motor amp draw after replacement."
    ]
  },
  "Contactor": {
    labor: 1.25,
    misc: 20,
    notes: [
      "Verify coil voltage.",
      "Inspect wiring and terminal condition."
    ]
  },
  "TXV": {
    labor: 5,
    misc: 120,
    notes: [
      "Recover refrigerant as needed.",
      "Replace filter drier.",
      "Pressure test, vacuum, and recharge."
    ]
  },
  "Leak Repair": {
    labor: 4,
    misc: 95,
    notes: [
      "Repair leak location.",
      "Pressure test with nitrogen.",
      "Pull vacuum and recharge system."
    ]
  },
  "RTU Replacement": {
    labor: 16,
    misc: 450,
    notes: [
      "Verify curb adapter.",
      "Review crane requirement.",
      "Verify electrical, gas, duct, and controls."
    ]
  },

  "ECM Blower Motor": {
    labor: 4,
    misc: 65,
    notes: [
      "Verify ECM module included.",
      "Verify airflow settings.",
      "Verify static pressure.",
      "Program motor if required."
    ]
  },

  "ECM Condenser Fan Motor": {
    labor: 3.5,
    misc: 55,
    notes: [
      "Verify OEM motor match.",
      "Verify RPM programming.",
      "Inspect condenser fan blade."
    ]
  },

  "Pressure Switch + Swivel Tee": {
    labor: 2,
    misc: 35,
    notes: [
      "Replace swivel tee if restricted.",
      "Verify pressure tubing.",
      "Verify pressure switch operation."
    ]
  },

  "Defrost Board": {
    labor: 2.5,
    misc: 35,
    notes: [
      "Verify sensors.",
      "Force defrost test.",
      "Verify reversing valve operation."
    ]
  },

  "Control Board": {
    labor: 2.5,
    misc: 35,
    notes: [
      "Verify incoming voltage.",
      "Verify safeties.",
      "Program board if required."
    ]
  },

  "Thermostat Wire Repair": {
    labor: 2,
    misc: 20,
    notes: [
      "Verify all conductors.",
      "Verify O/B wire operation.",
      "Verify heating and cooling."
    ]
  },

  "Duct Repair": {
    labor: 3,
    misc: 75,
    notes: [
      "Seal all joints.",
      "Verify airflow.",
      "Verify insulation."
    ]
  },

  "Condensate Drain PVC": {
    labor: 2,
    misc: 35,
    notes: [
      "Verify proper slope.",
      "Test drain flow.",
      "Verify no leaks."
    ]
  },

  "Condensate Drain Copper": {
    labor: 3,
    misc: 75,
    notes: [
      "Verify proper slope.",
      "Test drain flow.",
      "Verify no leaks."
    ]
  },

  "Thermostat Replacement": {
    labor: 1.5,
    misc: 20,
    notes: [
      "Program thermostat.",
      "Verify heating.",
      "Verify cooling.",
      "Verify fan operation."
    ]
  },

  "Split System Replacement": {
    labor: 16,
    misc: 450,
    notes: [
      "Verify line set.",
      "Pressure test with nitrogen.",
      "Pull vacuum.",
      "Startup and charge system.",
      "Verify electrical.",
      "Verify thermostat operation."
    ]
  }
};

export default function App() {
  const [customerName, setCustomerName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [estimateNumber, setEstimateNumber] = useState("");
  const [technician, setTechnician] = useState("");

  const [template, setTemplate] = useState("Condenser Fan Motor");
  const [job, setJob] = useState("Condenser fan motor replacement");
  const [equipment, setEquipment] = useState("RTU");
  const [model, setModel] = useState("");
  const [serviceType, setServiceType] = useState("regular");
  const [laborHours, setLaborHours] = useState(2.5);
  const [partsCost, setPartsCost] = useState(250);
  const [partsMarkup, setPartsMarkup] = useState(60);
  const [stories, setStories] = useState("1");
  const [access, setAccess] = useState("normal");
  const [misc, setMisc] = useState(45);
  const [craneCost, setCraneCost] = useState(0);

  const [directDriveMotor, setDirectDriveMotor] = useState(true);
  const [unitAge, setUnitAge] = useState("unknown");
  const [motorRusted, setMotorRusted] = useState("unknown");
  const [bladeNeeded, setBladeNeeded] = useState("review");

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [savedEstimates, setSavedEstimates] = useState(() => {
    return JSON.parse(localStorage.getItem("tsm_estimates") || "[]");
  });

  const rates = {
    regular: { label: "Regular Hours", trip: 150, labor: 125 },
    after: { label: "After Hours", trip: 225, labor: 187.5 },
    overtime: { label: "Overtime / Weekend", trip: 250, labor: 187.5 },
    holiday: { label: "Holiday", trip: 300, labor: 250 },
  };

  const applyTemplate = (name) => {
    setTemplate(name);
    const t = repairTemplates[name];
    if (!t) return;

    setLaborHours(t.labor);
    setMisc(t.misc);

    if (name !== "Custom") {
      setJob(name + " replacement");
    }

    if (t.directDrive) {
      setDirectDriveMotor(true);
    }
  };

  const runSearch = async () => {
    try {
      setSearchLoading(true);

      const response = await fetch("http://localhost:8787/api/estimate-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, equipment, model, stories, access }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setSearchResults(data);

      if (data.recommendedLaborHours) setLaborHours(data.recommendedLaborHours);
      if (data.recommendedPartsCost) setPartsCost(data.recommendedPartsCost);
    } catch (err) {
      console.error(err);
      alert("Search failed. Make sure backend is running on port 8787.");
    } finally {
      setSearchLoading(false);
    }
  };

  const heightAdd = stories === "1" ? 0 : stories === "2-5" ? 1 : 2;
  const accessAdd = access === "normal" ? 0 : access === "difficult" ? 1 : 2;
  const totalLaborHours = Number(laborHours) + heightAdd + accessAdd;

  const trip = rates[serviceType].trip;
  const laborRate = rates[serviceType].labor;
  const laborTotal = totalLaborHours * laborRate;
  const partsSell = Number(partsCost) * (1 + Number(partsMarkup) / 100);
  const customerTotal = trip + laborTotal + partsSell + Number(misc) + Number(craneCost);

  const internalLaborCost = totalLaborHours * 55;
  const internalCost = Number(partsCost) + internalLaborCost + Number(misc) + Number(craneCost);
  const grossProfit = customerTotal - internalCost;
  const grossMargin = customerTotal > 0 ? (grossProfit / customerTotal) * 100 : 0;

  const recommendation = useMemo(() => {
    if (stories === "5plus") return "CRANE / LIFT REVIEW REQUIRED";
    if (stories === "2-5" && access !== "normal") return "Possible lift or crane needed due to access.";
    return "No crane expected unless equipment is too heavy or roof access is unsafe.";
  }, [stories, access]);

  const isCondenserFanMotor =
    job.toLowerCase().includes("condenser fan motor") ||
    job.toLowerCase().includes("cond fan motor") ||
    template === "Condenser Fan Motor";

  const tsmRuleNotes = [];

  if (directDriveMotor || isCondenserFanMotor) {
    tsmRuleNotes.push("Direct-drive motor replacement should include a new capacitor.");
  }

  if (isCondenserFanMotor) {
    tsmRuleNotes.push("Verify condenser fan blade condition before repair.");
  }

  if (isCondenserFanMotor && (unitAge === "3-5" || unitAge === "5plus")) {
    tsmRuleNotes.push("Unit is 3+ years old. Fan blade may be seized/rusted to motor shaft and may need replacement.");
  }

  if (isCondenserFanMotor && motorRusted === "yes") {
    tsmRuleNotes.push("Motor/blade is rusted. Recommend adding condenser fan blade because blades often seize to the shaft.");
  }

  if (isCondenserFanMotor && bladeNeeded === "yes") {
    tsmRuleNotes.push("Condenser fan blade replacement is included/recommended.");
  }

  const templateNotes = repairTemplates[template]?.notes || [];
  const allNotes = [...templateNotes, ...tsmRuleNotes];

  const saveEstimate = () => {
    const newEstimate = {
      id: Date.now(),
      estimateNumber,
      customerName,
      siteName,
      siteAddress,
      contactName,
      technician,
      job,
      equipment,
      model,
      customerTotal,
      grossProfit,
      grossMargin,
      date: new Date().toLocaleString(),
    };

    const updated = [newEstimate, ...savedEstimates].slice(0, 20);
    setSavedEstimates(updated);
    localStorage.setItem("tsm_estimates", JSON.stringify(updated));
    alert("Estimate saved.");
  };

  const printProposal = () => {
    window.print();
  };

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div>
            <h1>Tri State Mechanical HVAC Estimator</h1>
            <p className="sub">Repair pricing, labor, parts markup, TSM rules, AI search, and proposal output.</p>
          </div>
          <div className="badge">TSM</div>
        </div>

        <h2>Customer / Job Info</h2>
        <div className="grid">
          <label>Customer Name<input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></label>
          <label>Site Name<input value={siteName} onChange={(e) => setSiteName(e.target.value)} /></label>
          <label>Site Address<input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} /></label>
          <label>Contact Name<input value={contactName} onChange={(e) => setContactName(e.target.value)} /></label>
          <label>Estimate / WO #<input value={estimateNumber} onChange={(e) => setEstimateNumber(e.target.value)} /></label>
          <label>Technician<input value={technician} onChange={(e) => setTechnician(e.target.value)} /></label>
        </div>

        <h2>Repair Template</h2>
        <div className="grid">
          <label>
            Select Repair
            <select value={template} onChange={(e) => applyTemplate(e.target.value)}>
              {Object.keys(repairTemplates).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>

          <label>
            Repair / Scope
            <input value={job} onChange={(e) => setJob(e.target.value)} />
          </label>

          <label>
            Equipment Type
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              <option>RTU</option>
              <option>Split System</option>
              <option>Package Unit</option>
              <option>Mini Split</option>
              <option>Freezer / Refrigeration</option>
              <option>Ductwork</option>
            </select>
          </label>

          <label>
            Model Number
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
        </div>

        <h2>Pricing</h2>
        <div className="grid">
          <label>
            Service Type
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="regular">Regular</option>
              <option value="after">After Hours</option>
              <option value="overtime">Overtime / Weekend</option>
              <option value="holiday">Holiday</option>
            </select>
          </label>

          <label>Labor Hours<input type="number" step="0.5" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} /></label>
          <label>Parts Cost<input type="number" value={partsCost} onChange={(e) => setPartsCost(e.target.value)} /></label>

          <label>
            Parts Markup %
            <div className="inline">
              <button type="button" onClick={() => setPartsMarkup(55)}>55%</button>
              <button type="button" onClick={() => setPartsMarkup(60)}>60%</button>
              <input type="number" value={partsMarkup} onChange={(e) => setPartsMarkup(e.target.value)} />
            </div>
          </label>

          <label>Misc Materials<input type="number" value={misc} onChange={(e) => setMisc(e.target.value)} /></label>
          <label>Crane / Lift Cost<input type="number" value={craneCost} onChange={(e) => setCraneCost(e.target.value)} /></label>
        </div>

        <h2>Building / Access</h2>
        <div className="grid">
          <label>
            Building Height
            <select value={stories} onChange={(e) => setStories(e.target.value)}>
              <option value="1">1 Story</option>
              <option value="2-5">2-5 Stories</option>
              <option value="5plus">5+ Stories</option>
            </select>
          </label>

          <label>
            Roof Access
            <select value={access} onChange={(e) => setAccess(e.target.value)}>
              <option value="normal">Normal</option>
              <option value="difficult">Difficult</option>
              <option value="noaccess">No Safe Access</option>
            </select>
          </label>
        </div>

        <h2>TSM Rules</h2>
        <div className="grid">
          <label>
            Direct Drive Motor?
            <select value={directDriveMotor ? "yes" : "no"} onChange={(e) => setDirectDriveMotor(e.target.value === "yes")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>

          <label>
            Unit Age
            <select value={unitAge} onChange={(e) => setUnitAge(e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="0-3">0-3 Years</option>
              <option value="3-5">3-5 Years</option>
              <option value="5plus">5+ Years</option>
            </select>
          </label>

          <label>
            Motor / Blade Rusted?
            <select value={motorRusted} onChange={(e) => setMotorRusted(e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>

          <label>
            Condenser Fan Blade
            <select value={bladeNeeded} onChange={(e) => setBladeNeeded(e.target.value)}>
              <option value="review">Review / Ask Tech</option>
              <option value="no">Not Needed</option>
              <option value="yes">Add Blade</option>
            </select>
          </label>
        </div>

        <div className="summary proposal">
          <h2>Customer Proposal</h2>
          <h3>{job}</h3>
          <p><b>Customer:</b> {customerName || "N/A"}</p>
          <p><b>Site:</b> {siteName || "N/A"} {siteAddress ? `| ${siteAddress}` : ""}</p>
          <p><b>Equipment:</b> {equipment} {model ? `| Model: ${model}` : ""}</p>

          <div className="big">${customerTotal.toFixed(2)}</div>

          <p><b>Trip Charge:</b> ${trip.toFixed(2)}</p>
          <p><b>Labor:</b> {totalLaborHours} hrs × ${laborRate.toFixed(2)} = ${laborTotal.toFixed(2)}</p>
          <p><b>Parts Sell Price:</b> ${partsSell.toFixed(2)}</p>
          <p><b>Misc Materials:</b> ${Number(misc).toFixed(2)}</p>
          <p><b>Crane / Lift:</b> ${Number(craneCost).toFixed(2)}</p>

          <div className="alert">{recommendation}</div>

          {allNotes.length > 0 && (
            <div className="alert">
              <h3>Required Notes</h3>
              {allNotes.map((note, index) => <p key={index}>{note}</p>)}
            </div>
          )}

          <h3>Internal Profit View</h3>
          <p><b>Internal Cost:</b> ${internalCost.toFixed(2)}</p>
          <p><b>Gross Profit:</b> ${grossProfit.toFixed(2)}</p>
          <p><b>Gross Margin:</b> {grossMargin.toFixed(1)}%</p>
        </div>

        <div className="chatbox no-print">
          <h2>AI Pricing Search</h2>
          <button onClick={runSearch} disabled={searchLoading}>
            {searchLoading ? "Searching..." : "Search Pricing + Labor"}
          </button>

          {searchResults && (
            <div style={{ marginTop: "20px" }}>
              <p><b>Parts Range:</b> ${searchResults.partsLow} - ${searchResults.partsHigh}</p>
              <p><b>Recommended Parts Cost:</b> ${searchResults.recommendedPartsCost}</p>
              <p><b>Labor Range:</b> {searchResults.laborLow} - {searchResults.laborHigh} hrs</p>
              <p><b>Recommended Labor:</b> {searchResults.recommendedLaborHours} hrs</p>
              <p><b>Crane Required:</b> {searchResults.craneRequired ? "YES" : "NO"}</p>
              <p><b>Reason:</b> {searchResults.craneReason}</p>
              <p><b>Notes:</b> {searchResults.notes}</p>
            </div>
          )}
        </div>

        <div className="actions no-print">
          <button onClick={saveEstimate}>Save Estimate</button>
          <button onClick={printProposal}>Print Proposal</button>
        </div>

        <div className="saved no-print">
          <h2>Saved Estimates</h2>
          {savedEstimates.length === 0 && <p>No saved estimates yet.</p>}
          {savedEstimates.map((est) => (
            <div className="savedItem" key={est.id}>
              <b>{est.estimateNumber || "No #"}</b> — {est.customerName || "No Customer"} — ${est.customerTotal.toFixed(2)} — {est.date}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
