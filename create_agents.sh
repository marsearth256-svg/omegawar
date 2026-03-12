#!/bin/bash

mkdir -p agents

for i in {1..200}
do
cat <<EOF > agents/agent_$i.py
print("Agent $i collecting news...")
EOF

done

echo "200 agents created"
