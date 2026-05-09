import re

# Read the generated jsx template
with open("stitch_dashboard.jsx", "r", encoding="utf-8") as f:
    template = f.read()

# Extract tailwind config
tailwind_config_match = re.search(r'Tailwind Config:\n(.*?)\n\*/', template, re.DOTALL)
tailwind_config = tailwind_config_match.group(1).strip() if tailwind_config_match else ""

# Extract custom css
custom_css_match = re.search(r'Custom CSS:\n(.*?)\n\*/', template, re.DOTALL)
custom_css = custom_css_match.group(1).strip() if custom_css_match else ""

# Extract JSX content
jsx_content_match = re.search(r'<div className="flex min-h-screen">.*', template, re.DOTALL)
jsx_content = jsx_content_match.group(0) if jsx_content_match else ""

# Perform data binding replacements in JSX content
jsx_content = jsx_content.replace('Dr. Peterson', '{doctordetails?.doctor_name || \'Doctor\'}')
jsx_content = jsx_content.replace('12 appointments', '{appointments.length} appointments')
jsx_content = jsx_content.replace('Sarah Jenkins — 09:30 AM', '{appointments[0] ? appointments[0].appointee_name + " — " + appointments[0].appointment_time : "No appointments"}')
jsx_content = jsx_content.replace('Post-Op Consultation', '{appointments[0] ? appointments[0].status : "-"}')
jsx_content = jsx_content.replace('1,284', '{patientdetails.length}')
jsx_content = jsx_content.replace('>12<', '>{appointments.length}<')
jsx_content = jsx_content.replace('842', '10')
jsx_content = jsx_content.replace('>4<', '>2<')

# Replace urgent updates static list with dynamic
urgent_updates_static = re.search(r'<div className="space-y-4">.*?</div>\n<button', jsx_content, re.DOTALL)
if urgent_updates_static:
    dynamic_updates = """<div className="space-y-4">
    {notifications.length > 0 ? notifications.slice(0, 3).map((notif, idx) => (
        <div key={idx} className="p-4 bg-surface-container-high rounded-2xl flex gap-4">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            <div>
                <p className="font-bold text-sm text-on-surface">{notif.type || 'Update'}</p>
                <p className="text-xs text-on-surface-variant">{notif.message}</p>
                <p className="text-[10px] mt-2 opacity-60">{notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}</p>
            </div>
        </div>
    )) : <p className="text-sm text-on-surface-variant">No recent updates.</p>}
</div>
<button"""
    jsx_content = jsx_content.replace(urgent_updates_static.group(0), dynamic_updates)

# Replace recent patients static list
patients_table_static = re.search(r'<tbody className="text-sm">.*?</tbody>', jsx_content, re.DOTALL)
if patients_table_static:
    dynamic_patients = """<tbody className="text-sm">
    {patientdetails.length > 0 ? patientdetails.slice(-5).reverse().map((patient, idx) => (
        <tr key={idx} className="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td className="py-4 font-semibold">{patient.first_name} {patient.last_name}</td>
            <td className="py-4 text-on-surface-variant">#{patient.patient_id} / {patient.gender}</td>
            <td className="py-4">{patient.room_number || '-'}</td>
            <td className="py-4"><span className="px-2 py-1 bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold rounded">{patient.reason_for_admission || 'ADMITTED'}</span></td>
        </tr>
    )) : <tr><td colSpan="4" className="py-4 text-center">No recent patients</td></tr>}
</tbody>"""
    jsx_content = jsx_content.replace(patients_table_static.group(0), dynamic_patients)

# Replace available nurses static list
nurses_list_static = re.search(r'<div className="grid grid-cols-1 md:grid-cols-2 gap-4">.*?</div>\n</div>\n</section>', jsx_content, re.DOTALL)
if nurses_list_static:
    dynamic_nurses = """<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {nurses.filter((n) => n.available === 1 || n.available === "1" || n.available === true).slice(0, 4).map((nurse, idx) => (
        <div key={idx} className="p-4 bg-white/60 rounded-2xl border border-white flex items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-primary p-2 bg-primary-fixed/30 rounded-xl">medical_services</span>
            <div>
                <p className="font-bold text-sm">{nurse.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-xs text-on-surface-variant font-medium">{nurse.shift} Shift</span>
                </div>
            </div>
            <button className="ml-auto p-2 hover:bg-primary-fixed/30 rounded-full text-primary">
                <span className="material-symbols-outlined">chat</span>
            </button>
        </div>
    ))}
</div>
</div>
</section>"""
    jsx_content = jsx_content.replace(nurses_list_static.group(0), dynamic_nurses)


# Construct final React component
final_code = f"""import React, {{ useEffect, useState }} from 'react';
import {{ Link, useNavigate }} from 'react-router-dom';
import {{ useAuth }} from '../../context/AuthContext';
import {{ getDoctorDashboardOverview }} from '../../services/doctorApi';

function DoctorDashboardPage() {{
  const {{ logout }} = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({{
    doctordetails: null,
    patientdetails: [],
    appointments: [],
    nurses: [],
    notifications: [],
    chartLabels: [],
    chartData: [],
  }});

  const [admittedVsDischarged, setAdmittedVsDischarged] = useState({{ admitted: 0, discharged: 0 }});

  useEffect(() => {{
    // Setup Tailwind and CSS
    if (!document.getElementById('tailwind-config-script')) {{
      const configScript = document.createElement('script');
      configScript.id = 'tailwind-config-script';
      configScript.innerHTML = `{tailwind_config}`;
      document.head.appendChild(configScript);
      
      const cdnScript = document.createElement('script');
      cdnScript.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
      document.head.appendChild(cdnScript);

      const fontLink = document.createElement('link');
      fontLink.href = "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);

      const style = document.createElement('style');
      style.innerHTML = `{custom_css}`;
      document.head.appendChild(style);
    }}

    async function fetchData() {{
      try {{
        const response = await getDoctorDashboardOverview();
        if (!response.ok) {{
          setError(response.data?.message || 'Failed to load doctor dashboard');
          setLoading(false);
          return;
        }}

        setPayload({{
          doctordetails: response.data.doctordetails || null,
          patientdetails: response.data.patientdetails || [],
          appointments: response.data.appointments || [],
          nurses: response.data.nurses || [],
          notifications: response.data.notifications || [],
          chartLabels: response.data.chartLabels || [],
          chartData: response.data.chartData || [],
        }});

        const donutRes = await fetch('/admitted-vs-discharged');
        if (donutRes.ok) {{
          const donutData = await donutRes.json();
          setAdmittedVsDischarged({{
            admitted: donutData.admitted || 0,
            discharged: donutData.discharged || 0,
          }});
        }}
      }} catch (err) {{
        setError('Error fetching dashboard data');
      }} finally {{
        setLoading(false);
      }}
    }}

    fetchData();
  }}, []);

  const handleLogout = async () => {{
    await logout();
    navigate('/');
  }};

  if (loading) return <div style={{{{ padding: 20 }}}}>Loading dashboard...</div>;
  if (error) return <div style={{{{ padding: 20, color: 'red' }}}}>{{error}}</div>;

  const {{ doctordetails, patientdetails, appointments, nurses, notifications }} = payload;

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden">
      {jsx_content}
    </div>
  );
}}

export default DoctorDashboardPage;
"""

with open(r"client\src\pages\migration\DoctorDashboardPage.jsx", "w", encoding="utf-8") as f:
    f.write(final_code)
